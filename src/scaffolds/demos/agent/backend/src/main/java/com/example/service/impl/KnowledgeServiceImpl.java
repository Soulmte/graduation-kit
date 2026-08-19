package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.KnowledgeDTO;
import com.example.dto.KnowledgeQuery;
import com.example.entity.Agent;
import com.example.entity.Knowledge;
import com.example.mapper.AgentMapper;
import com.example.mapper.KnowledgeMapper;
import com.example.service.KnowledgeService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 知识库服务实现
 *
 * 检索策略：把问题切成若干关键词，逐条计算命中得分，排序取前 K 条。
 * 没上向量检索是权衡后的选择——毕设的知识量在几十到几百条，
 * 关键词召回的准确率够用，且不用部署 embedding 服务，
 * 答辩时也能把"为什么能查到这条"讲清楚。
 */
@Service
public class KnowledgeServiceImpl extends ServiceImpl<KnowledgeMapper, Knowledge>
        implements KnowledgeService {

    /** 默认召回条数 */
    private static final int DEFAULT_TOP_K = 3;

    /** 召回条数上限，防止拼出超长提示词把 token 烧光 */
    private static final int MAX_TOP_K = 10;

    /** 关键词最短长度，一个字的词（"的""了"）区分度太低 */
    private static final int MIN_TERM_LEN = 2;

    private final AgentMapper agentMapper;

    public KnowledgeServiceImpl(AgentMapper agentMapper) {
        this.agentMapper = agentMapper;
    }

    @Override
    public IPage<Knowledge> pageQuery(KnowledgeQuery query) {
        Page<Knowledge> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Knowledge> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            String kw = query.getKeyword();
            wrapper.and(w -> w.like(Knowledge::getTitle, kw)
                    .or().like(Knowledge::getContent, kw)
                    .or().like(Knowledge::getKeywords, kw));
        }
        if (Boolean.TRUE.equals(query.getGlobalOnly())) {
            wrapper.isNull(Knowledge::getAgentId);
        } else if (query.getAgentId() != null) {
            wrapper.eq(Knowledge::getAgentId, query.getAgentId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Knowledge::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "hitCount" -> wrapper.orderBy(true, isAsc, Knowledge::getHitCount);
                case "title" -> wrapper.orderBy(true, isAsc, Knowledge::getTitle);
                case "createTime" -> wrapper.orderBy(true, isAsc, Knowledge::getCreateTime);
                default -> wrapper.orderByDesc(Knowledge::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Knowledge::getCreateTime);
        }

        IPage<Knowledge> result = this.page(page, wrapper);
        fillAgentName(result.getRecords());
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveOrUpdateKnowledge(KnowledgeDTO dto) {
        // 指定了智能体就校一下存不存在，留空表示全局条目
        if (dto.getAgentId() != null && agentMapper.selectById(dto.getAgentId()) == null) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }

        Knowledge knowledge = new Knowledge();
        BeanUtils.copyProperties(dto, knowledge);

        if (dto.getId() == null) {
            knowledge.setHitCount(0);
            this.save(knowledge);
        } else {
            if (this.getById(dto.getId()) == null) {
                throw new BusinessException(ResultCode.KNOWLEDGE_NOT_EXIST);
            }
            // hitCount 不让前端改，只能由检索累加
            knowledge.setHitCount(null);
            this.updateById(knowledge);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<Knowledge> retrieve(Long agentId, String question, Integer topK) {
        if (!StringUtils.hasText(question)) {
            return Collections.emptyList();
        }
        int limit = topK == null || topK <= 0 ? DEFAULT_TOP_K : Math.min(topK, MAX_TOP_K);

        // 先把候选集拉出来：本智能体的 + 全局的，只要启用中的。
        // 毕设的知识量就几十到几百条，一次性载在内存里算分比拼 SQL 打分好调试得多。
        LambdaQueryWrapper<Knowledge> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Knowledge::getStatus, Knowledge.STATUS_ON)
                .and(w -> w.isNull(Knowledge::getAgentId).or().eq(Knowledge::getAgentId, agentId));
        List<Knowledge> candidates = this.list(wrapper);
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> terms = splitTerms(question);
        if (terms.isEmpty()) {
            return Collections.emptyList();
        }

        // 按得分排，分数一样时命中多的靠前
        List<Knowledge> hits = candidates.stream()
                .filter(k -> score(k, terms) > 0)
                .sorted(Comparator.comparingInt((Knowledge k) -> score(k, terms)).reversed()
                        .thenComparing(Knowledge::getHitCount, Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());

        if (!hits.isEmpty()) {
            bumpHitCount(hits);
        }
        return hits;
    }

    /**
     * 把问题切成候选词。
     *
     * 中文没有空格分词，这里用二元滑窗（bigram）：
     * “押一付三” → 押一、一付、付三。虽然粗糙，但不用引分词器，
     * 且能匹配上知识条目里的“押一付三”，对毕设场景已经够用。
     * 英文与数字按空白切，保留原词。
     */
    private List<String> splitTerms(String question) {
        Set<String> terms = new LinkedHashSet<>();

        // 英文单词与数字直接当词
        for (String word : question.split("[^\\p{L}\\p{N}]+")) {
            if (word.length() >= MIN_TERM_LEN && word.chars().noneMatch(c -> c > 127)) {
                terms.add(word.toLowerCase());
            }
        }

        // 中文走二元滑窗
        String clean = question.replaceAll("[^\\p{L}\\p{N}]", "");
        for (int i = 0; i + MIN_TERM_LEN <= clean.length(); i++) {
            terms.add(clean.substring(i, i + MIN_TERM_LEN));
        }
        return new ArrayList<>(terms);
    }

    /**
     * 算得分。三个字段权重不同：
     *   keywords 命中计 5 分（管理员亲手标的词，最可信）
     *   title    命中计 3 分
     *   content  命中计 1 分
     */
    private int score(Knowledge k, List<String> terms) {
        String keywords = k.getKeywords() == null ? "" : k.getKeywords().toLowerCase();
        String title = k.getTitle() == null ? "" : k.getTitle().toLowerCase();
        String content = k.getContent() == null ? "" : k.getContent().toLowerCase();

        int total = 0;
        for (String term : terms) {
            if (keywords.contains(term)) {
                total += 5;
            }
            if (title.contains(term)) {
                total += 3;
            }
            if (content.contains(term)) {
                total += 1;
            }
        }
        return total;
    }

    /**
     * 命中次数自增。用 SQL 自增而不是读出来加一再写回，并发下不会丢数。
     */
    private void bumpHitCount(List<Knowledge> hits) {
        List<Long> ids = hits.stream().map(Knowledge::getId).collect(Collectors.toList());
        LambdaUpdateWrapper<Knowledge> bump = new LambdaUpdateWrapper<>();
        bump.in(Knowledge::getId, ids).setSql("hit_count = hit_count + 1");
        this.update(bump);
    }

    /**
     * 回填所属智能体名称，agentId 为 NULL 的显示“全局”。
     * 一次批量查完，不在循环里发 SQL。
     */
    private void fillAgentName(List<Knowledge> records) {
        if (records == null || records.isEmpty()) {
            return;
        }
        Set<Long> agentIds = records.stream()
                .map(Knowledge::getAgentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> nameMap = new HashMap<>();
        if (!agentIds.isEmpty()) {
            LambdaQueryWrapper<Agent> wrapper = new LambdaQueryWrapper<>();
            wrapper.in(Agent::getId, agentIds).select(Agent::getId, Agent::getName);
            agentMapper.selectList(wrapper).forEach(a -> nameMap.put(a.getId(), a.getName()));
        }

        records.forEach(k -> k.setAgentName(
                k.getAgentId() == null ? "全局" : nameMap.getOrDefault(k.getAgentId(), "已删除")));
    }
}
