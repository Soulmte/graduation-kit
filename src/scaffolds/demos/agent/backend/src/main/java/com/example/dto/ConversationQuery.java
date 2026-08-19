package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 会话查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ConversationQuery extends PageQuery {
    /**
     * 会话标题（模糊查询）
     */
    private String title;

    /**
     * 智能体ID。为空则不限
     */
    private Long agentId;

    /**
     * 所属用户ID。
     *
     * 前台接口会强制覆盖成当前登录用户，避免越权翻别人的会话；
     * 只有管理端会话管理页才允许按用户筛。
     */
    private Long userId;
}
