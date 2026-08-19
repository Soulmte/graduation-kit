package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.AgentQuery;
import com.example.dto.AgentSaveDTO;
import com.example.dto.GraphDTO;
import com.example.entity.*;
import com.example.mapper.*;
import com.example.service.AgentService;
import com.example.service.datasource.DataSourceRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 智能体服务实现
 *
 * 画布的存法：整张图序列化成 JSON 存进 agent.graph_json 一个字段，
 * 没有拆成节点表与边表。理由是编排的改动是"整体重画"而不是"增删单点"，
 * 整体覆盖比增量同步好写得多，也不会出现节点删了边还留着的脏数据。
 */
@Service
public class AgentServiceImpl extends ServiceImpl<AgentMapper, Agent> implements AgentService {

    private final ModelConfigMapper modelConfigMapper;
    private final KnowledgeMapper knowledgeMapper;
    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;
    private final DataSourceRegistry dataSourceRegistry;
    private final ObjectMapper objectMapper;

    public AgentServiceImpl(ModelConfigMapper modelConfigMapper,
                            KnowledgeMapper knowledgeMapper,
                            ConversationMapper conversationMapper,
                            MessageMapper messageMapper,
                            DataSourceRegistry dataSourceRegistry,
                            ObjectMapper objectMapper) {
        this.modelConfigMapper = modelConfigMapper;
        this.knowledgeMapper = knowledgeMapper;
        this.conversationMapper = conversationMapper;
        this.messageMapper = messageMapper;
        this.dataSourceRegistry = dataSourceRegistry;
        this.objectMapper = objectMapper;
    }

    @Override
    public IPage<Agent> pageQuery(AgentQuery query) {
        Page<Agent> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Agent> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getName())) {
            wrapper.like(Agent::getName, query.getName());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Agent::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "name" -> wrapper.orderBy(true, isAsc, Agent::getName);
                case "sort" -> wrapper.orderBy(true, isAsc, Agent::getSort);
                case "chatCount" -> wrapper.orderBy(true, isAsc, Agent::getChatCount);
                case "createTime" -> wrapper.orderBy(true, isAsc, Agent::getCreateTime);
                default -> wrapper.orderByDesc(Agent::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Agent::getCreateTime);
        }

        IPage<Agent> result = this.page(page, wrapper);
        fillExtra(result.getRecords());
        return result;
    }

    @Override
    public List<Agent> listPublished() {
        LambdaQueryWrapper<Agent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Agent::getStatus, Agent.STATUS_PUBLISHED)
                .orderByAsc(Agent::getSort)
                .orderByDesc(Agent::getPublishTime);
        return this.list(wrapper);
    }

    @Override
    public Agent getDetail(Long id, boolean onlyPublished) {
        Agent agent = this.getById(id);
        if (agent == null) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }
        // 前台路径：草稿不能被看到，直接当不存在，不报“未发布”以免泄露存在性
        if (onlyPublished && (agent.getStatus() == null || agent.getStatus() != Agent.STATUS_PUBLISHED)) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }
        fillExtra(Collections.singletonList(agent));
        return agent;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveOrUpdateAgent(AgentSaveDTO dto) {
        LambdaQueryWrapper<Agent> dup = new LambdaQueryWrapper<>();
        dup.eq(Agent::getName, dto.getName());
        if (dto.getId() != null) {
            dup.ne(Agent::getId, dto.getId());
        }
        if (this.count(dup) > 0) {
            throw new BusinessException("已经有叫【" + dto.getName() + "】的智能体了，换个名字");
        }

        ModelConfig model = modelConfigMapper.selectById(dto.getModelConfigId());
        if (model == null) {
            throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
        }

        Agent agent = new Agent();
        BeanUtils.copyProperties(dto, agent);

        if (dto.getId() == null) {
            agent.setStatus(Agent.STATUS_DRAFT);
            agent.setChatCount(0);
            // 新建时给一张默认画布，管理员进编排页就能直接调参，不用从零拖
            agent.setGraphJson(defaultGraph(dto.getModelConfigId()));
            this.save(agent);
        } else {
            if (this.getById(dto.getId()) == null) {
                throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
            }
            // 这两个字段不走基础信息表单，防止被意外置空
            agent.setChatCount(null);
            agent.setGraphJson(null);
            this.updateById(agent);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveGraph(Long id, GraphDTO graph) {
        Agent agent = this.getById(id);
        if (agent == null) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }
        validateGraph(graph);

        String json;
        try {
            json = objectMapper.writeValueAsString(graph);
        } catch (Exception e) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                    "画布序列化失败：" + e.getMessage());
        }

        LambdaUpdateWrapper<Agent> update = new LambdaUpdateWrapper<>();
        update.eq(Agent::getId, id).set(Agent::getGraphJson, json);
        this.update(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void publish(Long id, boolean publish) {
        Agent agent = this.getById(id);
        if (agent == null) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }

        LambdaUpdateWrapper<Agent> update = new LambdaUpdateWrapper<>();
        update.eq(Agent::getId, id);

        if (publish) {
            // 发布前再校一遍：画布可能是早前存的，引用的模型后来被停用也有可能
            validateGraph(parseGraph(agent.getGraphJson()));
            update.set(Agent::getStatus, Agent.STATUS_PUBLISHED)
                    .set(Agent::getPublishTime, LocalDateTime.now());
        } else {
            update.set(Agent::getStatus, Agent.STATUS_DRAFT);
        }
        this.update(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeAgent(Long id) {
        Agent agent = this.getById(id);
        if (agent == null) {
            throw new BusinessException(ResultCode.AGENT_NOT_EXIST);
        }

        // 先把会话下的消息物理删掉（message 没有逻辑删除列）
        LambdaQueryWrapper<Conversation> convWrapper = new LambdaQueryWrapper<>();
        convWrapper.eq(Conversation::getAgentId, id).select(Conversation::getId);
        List<Long> convIds = conversationMapper.selectList(convWrapper).stream()
                .map(Conversation::getId).collect(Collectors.toList());
        if (!convIds.isEmpty()) {
            LambdaQueryWrapper<Message> msgWrapper = new LambdaQueryWrapper<>();
            msgWrapper.in(Message::getConversationId, convIds);
            messageMapper.delete(msgWrapper);

            LambdaQueryWrapper<Conversation> delConv = new LambdaQueryWrapper<>();
            delConv.eq(Conversation::getAgentId, id);
            conversationMapper.delete(delConv);
        }

        // 名下的知识条目一并逻辑删除，全局条目（agent_id 为 NULL）不动
        LambdaQueryWrapper<Knowledge> knowWrapper = new LambdaQueryWrapper<>();
        knowWrapper.eq(Knowledge::getAgentId, id);
        knowledgeMapper.delete(knowWrapper);

        this.removeById(id);
    }

    @Override
    public void increaseChatCount(Long id) {
        LambdaUpdateWrapper<Agent> bump = new LambdaUpdateWrapper<>();
        bump.eq(Agent::getId, id).setSql("chat_count = chat_count + 1");
        this.update(bump);
    }

    /**
     * 把 graph_json 反序列化回 GraphDTO
     */
    @Override
    public GraphDTO parseGraph(String graphJson) {
        if (!StringUtils.hasText(graphJson)) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "还没有配置编排，先去画布里搭一个");
        }
        try {
            return objectMapper.readValue(graphJson, GraphDTO.class);
        } catch (Exception e) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                    "编排数据解析失败：" + e.getMessage());
        }
    }

    /**
     * 校验画布。因为只支持单链（没有条件分支），校验规则很短：
     *   1. 有且只有一个 start，有至少一个 end
     *   2. 至少有一个 llm（没模型节点就不会说话）
     *   3. 节点 id 不能重，边的两端必须能对应到节点
     *   4. 从 start 能一路走到 end，且途中不成环
     *   5. 每个节点自身参数齐备（llm 必须能找到可用模型）
     */
    @Override
    public void validateGraph(GraphDTO graph) {
        if (graph == null || graph.getNodes() == null || graph.getNodes().isEmpty()) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "画布是空的，至少要有开始与结束节点");
        }

        Map<String, GraphDTO.Node> nodeMap = new LinkedHashMap<>();
        for (GraphDTO.Node node : graph.getNodes()) {
            if (!StringUtils.hasText(node.getId()) || !StringUtils.hasText(node.getType())) {
                throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "有节点缺少 id 或类型");
            }
            if (nodeMap.put(node.getId(), node) != null) {
                throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                        "节点 " + node.getId() + " 重复了");
            }
        }

        List<GraphDTO.Node> starts = byType(graph, GraphDTO.TYPE_START);
        if (starts.size() != 1) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                    starts.isEmpty() ? "缺一个开始节点" : "只能有一个开始节点");
        }
        if (byType(graph, GraphDTO.TYPE_END).isEmpty()) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "缺一个结束节点");
        }
        if (byType(graph, GraphDTO.TYPE_LLM).isEmpty()) {
            throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                    "至少要有一个大模型节点，否则智能体不会回答");
        }

        // 逐个节点校参数
        for (GraphDTO.Node node : graph.getNodes()) {
            validateNodeData(node);
        }

        // 边的两端必须存在，且单链下一个节点只能有一条出边
        Map<String, String> next = new HashMap<>();
        if (graph.getEdges() != null) {
            for (GraphDTO.Edge edge : graph.getEdges()) {
                if (!nodeMap.containsKey(edge.getSource()) || !nodeMap.containsKey(edge.getTarget())) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "有连线指向不存在的节点，删掉重连一下");
                }
                if (next.put(edge.getSource(), edge.getTarget()) != null) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "节点【" + title(nodeMap.get(edge.getSource())) + "】接了两条往下走的线，当前只支持单链编排");
                }
            }
        }

        // 从 start 走到头，看能不能到 end
        String cursor = starts.get(0).getId();
        Set<String> visited = new LinkedHashSet<>();
        while (cursor != null) {
            if (!visited.add(cursor)) {
                throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                        "连线绕成了环，会执行不完，检查一下节点【" + title(nodeMap.get(cursor)) + "】");
            }
            if (GraphDTO.TYPE_END.equals(nodeMap.get(cursor).getType())) {
                return;
            }
            cursor = next.get(cursor);
        }
        throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                "从开始节点走不到结束节点，中间有节点没连上");
    }

    /**
     * 校单个节点的参数。参数存在 data 里，类型不同字段不同。
     */
    private void validateNodeData(GraphDTO.Node node) {
        Map<String, Object> data = node.getData() == null ? Collections.emptyMap() : node.getData();
        String name = title(node);

        switch (node.getType()) {
            case GraphDTO.TYPE_START, GraphDTO.TYPE_END -> {
                // 这两类没有必填参数
            }
            case GraphDTO.TYPE_KNOWLEDGE -> {
                int topK = intOf(data.get("topK"), 3);
                if (topK < 1 || topK > 10) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】的召回条数要在 1~10 之间");
                }
            }
            case GraphDTO.TYPE_DATASOURCE -> {
                String source = (String) data.get("source");
                if (!StringUtils.hasText(source)) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】还没选数据源");
                }
                if (dataSourceRegistry.get(source) == null) {
                    // 实现类被删掉或改了 key，早报比等到用户提问时才炸好
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】选的数据源【" + source + "】不存在了，重新选一个");
                }
            }
            case GraphDTO.TYPE_LLM -> {
                Long modelId = longOf(data.get("modelConfigId"));
                if (modelId == null) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】还没选模型");
                }
                ModelConfig model = modelConfigMapper.selectById(modelId);
                if (model == null) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】选的模型已经被删了，重新选一个");
                }
                if (model.getStatus() != null && model.getStatus() == ModelConfig.STATUS_OFF) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】选的模型【" + model.getName() + "】已停用");
                }
                if (!StringUtils.hasText((String) data.get("systemPrompt"))) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "【" + name + "】的系统提示词不能为空");
                }
            }
            default -> throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                    "不认识的节点类型：" + node.getType());
        }
    }

    /**
     * 按类型筛节点
     */
    private List<GraphDTO.Node> byType(GraphDTO graph, String type) {
        return graph.getNodes().stream()
                .filter(n -> type.equals(n.getType()))
                .collect(Collectors.toList());
    }

    /**
     * 取节点标题，没填就用 id 兑，保证报错消息能定位到具体节点
     */
    private String title(GraphDTO.Node node) {
        if (node == null) {
            return "未知节点";
        }
        Object t = node.getData() == null ? null : node.getData().get("title");
        return t == null || !StringUtils.hasText(t.toString()) ? node.getId() : t.toString();
    }

    /**
     * data 里的值来自 JSON，数字可能是 Integer、Long 或 String，
     * 下面两个方法把这些情况统一接住。
     */
    private int intOf(Object value, int def) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {
                return def;
            }
        }
        return def;
    }

    private Long longOf(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return Long.parseLong(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    /**
     * 新建智能体时的默认画布：开始 → 检索 → 大模型 → 结束。
     * 直接给一条能跑的链，管理员进编排页只需要改提示词，不用从空白画布开始拖。
     */
    private String defaultGraph(Long modelConfigId) {
        GraphDTO graph = new GraphDTO();

        graph.getNodes().add(node("start_1", GraphDTO.TYPE_START, 60, 200,
                Map.of("title", "开始")));
        graph.getNodes().add(node("knowledge_1", GraphDTO.TYPE_KNOWLEDGE, 300, 200,
                Map.of("title", "检索知识库", "topK", 3)));
        graph.getNodes().add(node("llm_1", GraphDTO.TYPE_LLM, 560, 200,
                Map.of("title", "生成回答",
                        "modelConfigId", modelConfigId,
                        "systemPrompt", "你是一位专业的咨询助手。回答要口语化、分条。"
                                + "参考资料里有的就依据资料回答，没有就直说不确定，不要编造。",
                        "temperature", 0.7,
                        "useHistory", true,
                        "historyLimit", 6)));
        graph.getNodes().add(node("end_1", GraphDTO.TYPE_END, 820, 200,
                Map.of("title", "结束")));

        graph.getEdges().add(edge("e_s1_k1", "start_1", "knowledge_1"));
        graph.getEdges().add(edge("e_k1_l1", "knowledge_1", "llm_1"));
        graph.getEdges().add(edge("e_l1_e1", "llm_1", "end_1"));

        try {
            return objectMapper.writeValueAsString(graph);
        } catch (Exception e) {
            // 默认画布是写死的，序列化不可能失败；真失败了宁可不给初始画布，不能卡住新建
            return null;
        }
    }

    private GraphDTO.Node node(String id, String type, int x, int y, Map<String, Object> data) {
        GraphDTO.Node n = new GraphDTO.Node();
        n.setId(id);
        n.setType(type);
        n.setPosition(Map.of("x", x, "y", y));
        n.setData(new LinkedHashMap<>(data));
        return n;
    }

    private GraphDTO.Edge edge(String id, String source, String target) {
        GraphDTO.Edge e = new GraphDTO.Edge();
        e.setId(id);
        e.setSource(source);
        e.setTarget(target);
        return e;
    }

    /**
     * 回填模型名与知识条目数。两次批量查询搞定，不在循环里发 SQL。
     */
    private void fillExtra(List<Agent> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        Set<Long> modelIds = records.stream()
                .map(Agent::getModelConfigId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!modelIds.isEmpty()) {
            LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
            wrapper.in(ModelConfig::getId, modelIds).select(ModelConfig::getId, ModelConfig::getName);
            Map<Long, String> nameMap = new HashMap<>();
            modelConfigMapper.selectList(wrapper).forEach(m -> nameMap.put(m.getId(), m.getName()));
            records.forEach(a -> a.setModelConfigName(
                    a.getModelConfigId() == null ? null : nameMap.getOrDefault(a.getModelConfigId(), "已删除")));
        }

        // 知识条目数只算挂在自己名下的，全局条目不计入。
        // 用一次 group by 算完，不要在循环里逐个 selectCount（N+1）。
        List<Long> agentIds = records.stream().map(Agent::getId).collect(Collectors.toList());
        QueryWrapper<Knowledge> countWrapper = new QueryWrapper<>();
        countWrapper.select("agent_id", "COUNT(*) AS cnt")
                .in("agent_id", agentIds)
                .eq("deleted", 0)
                .groupBy("agent_id");

        Map<Long, Long> countMap = new HashMap<>();
        for (Map<String, Object> row : knowledgeMapper.selectMaps(countWrapper)) {
            Object key = row.get("agent_id");
            Object cnt = row.get("cnt");
            if (key instanceof Number k && cnt instanceof Number c) {
                countMap.put(k.longValue(), c.longValue());
            }
        }
        records.forEach(a -> a.setKnowledgeCount(countMap.getOrDefault(a.getId(), 0L)));
    }
}
