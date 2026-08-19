package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 消息实体类
 *
 * 消息只追写不修改，所以没有 updateTime 与逻辑删除列，
 * 删会话时按 conversationId 物理删除。
 *
 * nodeTrace 记本次回答走过哪些节点、每步耗时与产出，
 * 前台可以展开看"推理过程"，调编排时也靠它定位哪一步出了问题。
 */
@Data
@TableName("message")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Message {

    /** 用户提问 */
    public static final String ROLE_USER = "user";
    /** 智能体回复 */
    public static final String ROLE_ASSISTANT = "assistant";
    /** 系统提示词 */
    public static final String ROLE_SYSTEM = "system";

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属会话ID
     */
    private Long conversationId;

    /**
     * 角色：user-用户，assistant-智能体，system-系统
     */
    private String role;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 执行轨迹：[{ nodeKey, nodeType, title, cost, output }]
     *
     * 同样存 String，后端只负责序列化写入，前端 JSON.parse 后渲染。
     */
    private String nodeTrace;

    /**
     * 本条消耗的 token 数
     */
    private Integer tokenUsage;

    /**
     * 生成耗时（毫秒）
     */
    private Long costMs;

    /**
     * 失败原因，成功时为空
     */
    private String errorMsg;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
