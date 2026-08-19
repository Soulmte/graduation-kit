package com.example.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 画布保存入参
 *
 * 结构与 Vue Flow 的 toObject() 对齐，前端存什么后端就收什么：
 *   nodes: [{ id, type, position: { x, y }, data: { title, ...节点参数 } }]
 *   edges: [{ id, source, target }]
 *
 * data 用 Map 承接而不是定义成四种节点各一个类：
 * 节点参数会随需求变（今天加 topK，明天加 temperature），
 * 用 Map 就不用每次动 DTO，校验逻辑集中放在 AgentServiceImpl.validateGraph。
 *
 * viewport（画布缩放与平移）也一并存下来，下次打开编排页视角不变。
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GraphDTO {

    /** 开始节点：接收用户提问 */
    public static final String TYPE_START = "start";
    /** 知识检索节点：召回资料拼进提示词 */
    public static final String TYPE_KNOWLEDGE = "knowledge";
    /** 查数据节点：调业务表拿实时数据，具体查什么由 DataSourceProvider 定 */
    public static final String TYPE_DATASOURCE = "datasource";
    /** 大模型节点：调模型生成回答 */
    public static final String TYPE_LLM = "llm";
    /** 结束节点：输出收尾 */
    public static final String TYPE_END = "end";

    /**
     * 节点列表
     */
    @NotEmpty(message = "画布不能为空，至少要有开始与结束节点")
    private List<Node> nodes = new ArrayList<>();

    /**
     * 连线列表
     */
    private List<Edge> edges = new ArrayList<>();

    /**
     * 画布视角，原样存取，后端不解析
     */
    private Map<String, Object> viewport;

    /**
     * 节点
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Node {
        /**
         * 节点唯一标识，如 llm_1
         */
        private String id;

        /**
         * 节点类型：start/knowledge/datasource/llm/end
         */
        private String type;

        /**
         * 画布坐标
         */
        private Map<String, Object> position;

        /**
         * 节点参数，各类型字段不同：
         *   start      ：title
         *   knowledge  ：title、topK
         *   datasource ：title、source（数据源 key）、params（筛选参数，字段由数据源自己声明）
         *   llm        ：title、modelConfigId、systemPrompt、temperature、useHistory、historyLimit
         *   end        ：title
         */
        private Map<String, Object> data = new LinkedHashMap<>();
    }

    /**
     * 连线
     */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Edge {
        /**
         * 边唯一标识
         */
        private String id;

        /**
         * 起点节点ID
         */
        private String source;

        /**
         * 终点节点ID
         */
        private String target;
    }
}
