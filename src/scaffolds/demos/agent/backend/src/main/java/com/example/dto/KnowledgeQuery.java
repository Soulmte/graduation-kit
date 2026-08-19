package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 知识条目查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class KnowledgeQuery extends PageQuery {
    /**
     * 标题或正文（模糊查询）
     */
    private String keyword;

    /**
     * 归属智能体ID。为空则不限
     */
    private Long agentId;

    /**
     * 只看全局条目（agent_id 为 NULL）
     */
    private Boolean globalOnly;

    /**
     * 状态：0-停用，1-启用。为空则不限
     */
    private Integer status;
}
