package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 智能体实体类
 *
 * 状态流转很简单，只有两态：
 *   0 草稿（前台不可见，可反复改画布）--发布--> 1 已发布（前台列表出现）
 *   1 已发布 --撤回--> 0 草稿
 *
 * graphJson 存整张画布，就是 Vue Flow toObject() 的原始结果：
 *   { nodes: [{ id, type, position: {x,y}, data: {...} }], edges: [{ id, source, target }] }
 * 没有拆成节点表与边表，因为编排改动频繁，整体覆盖比增量同步好写也好排错。
 * 后端只在发布前校验结构合法（有唯一 start、能走到 end、节点参数齐全）。
 */
@Data
@TableName("agent")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Agent {

    /** 草稿 */
    public static final int STATUS_DRAFT = 0;
    /** 已发布 */
    public static final int STATUS_PUBLISHED = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 智能体名称
     */
    private String name;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 简介，前台卡片上展示
     */
    private String description;

    /**
     * 开场白，新建会话时作为第一条回复
     */
    private String greeting;

    /**
     * 默认模型配置ID（llm 节点未单独指定时用它）
     */
    private Long modelConfigId;

    /**
     * 画布结构：{ nodes: [...], edges: [...] }
     *
     * 存成 String 而不是对象：这一堆 JSON 后端只需要透传与校验，
     * 不需要映成实体；还得配 TypeHandler 才能存对象，毕设里不值得。
     * 前端拿到后 JSON.parse 即可。
     */
    private String graphJson;

    /**
     * 状态：0-草稿，1-已发布
     */
    private Integer status;

    /**
     * 累计会话数
     */
    private Integer chatCount;

    /**
     * 前台排序值，越小越靠前
     */
    private Integer sort;

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
     * 最近一次发布时间
     */
    private LocalDateTime publishTime;

    /**
     * 逻辑删除标记：0-未删除，1-已删除
     */
    @TableLogic
    private Integer deleted;

    // ---- 以下字段联表回填，不落库 ----

    /**
     * 默认模型名称，管理端列表直接展示
     */
    @TableField(exist = false)
    private String modelConfigName;

    /**
     * 挂在该智能体下的知识条目数
     */
    @TableField(exist = false)
    private Long knowledgeCount;
}
