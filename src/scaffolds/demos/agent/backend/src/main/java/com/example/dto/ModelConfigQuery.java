package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 模型配置查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ModelConfigQuery extends PageQuery {
    /**
     * 配置名称（模糊查询）
     */
    private String name;

    /**
     * 厂商标识。为空则不限
     */
    private String provider;

    /**
     * 状态：0-停用，1-启用。为空则不限
     */
    private Integer status;
}
