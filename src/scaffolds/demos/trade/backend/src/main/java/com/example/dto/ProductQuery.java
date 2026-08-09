package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 商品查询条件
 * 买家端与商家端共用：买家端由 Service 强制 status=1，商家端强制 merchantId=自己的店
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ProductQuery extends PageQuery {
    /**
     * 商品名称（模糊查询）
     */
    private String name;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 商家ID
     */
    private Long merchantId;

    /**
     * 状态：0-下架，1-上架。为空则不限
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
