package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 知识条目实体类
 *
 * knowledge 节点的数据源。检索走关键词与 LIKE 召回，没有引入向量库：
 * 本科毕设的知识量在几十到几百条，关键词召回的效果够用，
 * 也不用额外部署 embedding 服务和向量数据库，答辩时更容易讲清原理。
 *
 * agentId 为 NULL 表示全局共享，所有智能体检索时都会带上。
 */
@Data
@TableName("knowledge")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Knowledge {

    /** 停用，检索时跳过 */
    public static final int STATUS_OFF = 0;
    /** 启用 */
    public static final int STATUS_ON = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 归属智能体ID，NULL 表示全局共享
     */
    private Long agentId;

    /**
     * 条目标题
     */
    private String title;

    /**
     * 条目正文，命中后拼进提示词
     */
    private String content;

    /**
     * 关键词，逗号分隔，召回时优先匹配
     */
    private String keywords;

    /**
     * 状态：0-停用，1-启用
     */
    private Integer status;

    /**
     * 命中次数，方便看哪些条目有用
     */
    private Integer hitCount;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 逻辑删除标记：0-未删除，1-已删除
     */
    @TableLogic
    private Integer deleted;

    // ---- 以下字段联表回填，不落库 ----

    /**
     * 所属智能体名称，NULL 时管理端显示“全局”
     */
    @TableField(exist = false)
    private String agentName;
}
