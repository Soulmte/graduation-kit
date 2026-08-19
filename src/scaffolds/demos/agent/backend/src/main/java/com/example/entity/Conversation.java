package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 会话实体类
 *
 * 一个用户对一个智能体可以开多个会话，侧边栏按 lastTime 倒序。
 * title 默认取首句提问的前 20 字，用户也可以改。
 */
@Data
@TableName("conversation")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Conversation {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属用户ID
     */
    private Long userId;

    /**
     * 智能体ID
     */
    private Long agentId;

    /**
     * 会话标题，默认取首句提问前 20 字
     */
    private String title;

    /**
     * 消息条数
     */
    private Integer msgCount;

    /**
     * 最后一条消息时间，列表按它倒序
     */
    private LocalDateTime lastTime;

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

    // ---- 以下字段联表或二次查询回填，不落库 ----

    /**
     * 智能体名称
     */
    @TableField(exist = false)
    private String agentName;

    /**
     * 智能体头像
     */
    @TableField(exist = false)
    private String agentAvatar;

    /**
     * 用户名，管理端会话列表展示
     */
    @TableField(exist = false)
    private String username;

    /**
     * 会话下的消息，仅详情接口回填
     */
    @TableField(exist = false)
    private List<Message> messages;
}
