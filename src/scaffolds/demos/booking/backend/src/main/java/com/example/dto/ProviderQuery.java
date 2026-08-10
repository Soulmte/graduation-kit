package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 机构查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ProviderQuery extends PageQuery {
    /**
     * 机构名称（模糊查询）
     */
    private String name;

    /**
     * 状态：0-待审核，1-正常，2-已封禁。为空则不限
     */
    private Integer status;
}
