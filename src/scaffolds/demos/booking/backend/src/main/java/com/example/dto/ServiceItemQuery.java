package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 服务项查询条件
 * 买家端与机构端共用：买家端由 Service 强制 status=1，机构端强制 providerId=自己的机构
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ServiceItemQuery extends PageQuery {
    /**
     * 服务名称（模糊查询）
     */
    private String name;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 机构ID
     */
    private Long providerId;

    /**
     * 状态：0-下线，1-上线。为空则不限
     */
    private Integer status;

    /**
     * 价格下限（含）
     */
    private BigDecimal minPrice;

    /**
     * 价格上限（含）
     */
    private BigDecimal maxPrice;
}
