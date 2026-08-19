package com.example.service.datasource;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.entity.Notice;
import com.example.service.NoticeService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 公告数据源 —— 「查数据」节点的示例实现，照着它接自己的业务表。
 *
 * <p>之所以拿公告表举例：它是脚手架自带的通用表，换成任何选题都存在，
 * 不需要先建业务表就能把整条链路跑通。真实项目里你会把它换成
 * 房源、商品、课程、工单这类自己的表，套路完全一样。
 *
 * <h3>照着改的四步</h3>
 * <ol>
 *   <li>复制本文件，改类名，注入你自己的 Service</li>
 *   <li>{@link #key()} 换成你的标识，{@link #label()} 换成中文名</li>
 *   <li>{@link #params()} 声明画布上要能配哪些筛选条件</li>
 *   <li>{@link #query} 里写查询，把结果拼成模型看得懂的文本</li>
 * </ol>
 *
 * 写完重启后端即可，管理端下拉框会自动多出一项，不用改前端。
 */
@Component
public class NoticeDataSource implements DataSourceProvider {

    /** 单条内容拼进提示词时的截断长度，避免一条长公告把 token 吃光 */
    private static final int CONTENT_MAX_LEN = 200;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final NoticeService noticeService;

    public NoticeDataSource(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @Override
    public String key() {
        return "notice";
    }

    @Override
    public String label() {
        return "公告库";
    }

    @Override
    public String description() {
        return "查 notice 表里的公告，可按标题关键词过滤。示例数据源，照它改成自己的业务表";
    }

    @Override
    public List<ParamSpec> params() {
        return List.of(
                ParamSpec.number("limit", "最多查几条",
                        "查太多会把提示词撑长、烧 token，一般 3~5 条够用"),
                ParamSpec.text("titleLike", "标题包含",
                        "留空表示不按标题过滤，直接取最新的几条"),
                ParamSpec.bool("useQuestion", "拿用户提问当关键词",
                        "开启后忽略上面的「标题包含」，改用用户这次问的话去匹配标题")
        );
    }

    /**
     * 查公告并拼成文本。
     *
     * <p>注意这里没有做分词，只是 like 匹配。真实场景如果要更准，
     * 可以参考 KnowledgeServiceImpl.retrieve 的二元滑窗打分做法。
     */
    @Override
    public String query(Map<String, Object> params, String question) {
        int limit = intOf(params.get("limit"), 3);
        // 上限卡死，防止有人在画布上填个 1000 把提示词撑爆
        limit = Math.max(1, Math.min(limit, 10));

        // 开了「拿用户提问当关键词」就用问题原文，否则用画布上配的固定词
        boolean useQuestion = boolOf(params.get("useQuestion"), false);
        String keyword = useQuestion ? question : strOf(params.get("titleLike"));

        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Notice::getTitle, keyword.trim());
        }
        wrapper.orderByDesc(Notice::getCreateTime).last("LIMIT " + limit);

        List<Notice> rows = noticeService.list(wrapper);
        if (rows.isEmpty()) {
            // 返回空串，引擎会告诉模型「没查到」。
            // 千万不要在这里返回一句编的话，模型会当成真事往外说。
            return null;
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < rows.size(); i++) {
            Notice n = rows.get(i);
            sb.append(i + 1).append(". ").append(n.getTitle());
            LocalDateTime time = n.getCreateTime();
            if (time != null) {
                sb.append('（').append(time.format(DATE_FMT)).append('）');
            }
            sb.append('\n');
            if (StringUtils.hasText(n.getContent())) {
                String content = n.getContent().trim();
                if (content.length() > CONTENT_MAX_LEN) {
                    content = content.substring(0, CONTENT_MAX_LEN) + "…";
                }
                sb.append("   ").append(content).append('\n');
            }
        }
        return sb.toString();
    }

    // ==================== 取值兜底 ====================
    // graph_json 过来的值类型不定（前端填数字、JSON 解析成 Integer 或 String
    // 都有可能），统一在这里兼容，业务代码里就不用到处判类型。

    private String strOf(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private int intOf(Object v, int def) {
        if (v instanceof Number n) {
            return n.intValue();
        }
        if (v instanceof String s && StringUtils.hasText(s)) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
                return def;
            }
        }
        return def;
    }

    private boolean boolOf(Object v, boolean def) {
        if (v instanceof Boolean b) {
            return b;
        }
        if (v instanceof String s && StringUtils.hasText(s)) {
            return Boolean.parseBoolean(s.trim());
        }
        return def;
    }
}
