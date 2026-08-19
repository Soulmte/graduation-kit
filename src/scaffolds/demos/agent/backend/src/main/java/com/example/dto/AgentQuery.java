package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 智能体查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AgentQuery extends PageQuery {
    /**
     * 智能体名称（模糊查询）
     */
    private String name;

    /**
     * 状态：0-草稿，1-已发布。为空则不限
     *
     * 前台接口会强制覆盖成 1，用户传什么都看不到草稿。
     */
    private Integer status;
}
