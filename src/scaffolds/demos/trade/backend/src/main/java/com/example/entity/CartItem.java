package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 购物车实体类
 * 不存价格：展示时实时读商品表，避免商品调价后购物车金额对不上
 */
@Data
@TableName("cart_item")
@JsonIgnoreProperties(ignoreUnknown = true)
public class CartItem {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 商品ID
     */
    private Long productId;

    /**
     * 数量
     */
    private Integer quantity;

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

    // ---- 以下字段实时取自商品表，仅用于购物车页展示，不落库 ----

    /**
     * 商品名称
     */
    @TableField(exist = false)
    private String productName;

    /**
     * 商品封面图
     */
    @TableField(exist = false)
    private String productCover;

    /**
     * 商品现价
     */
    @TableField(exist = false)
    private BigDecimal price;

    /**
     * 商品当前库存，前端据此提示"库存不足"
     */
    @TableField(exist = false)
    private Integer stock;

    /**
     * 商品当前状态，下架商品在购物车里要置灰
     */
    @TableField(exist = false)
    private Integer productStatus;

    /**
     * 所属商家ID，结算拆单时用
     */
    @TableField(exist = false)
    private Long merchantId;

    /**
     * 所属店铺名称
     */
    @TableField(exist = false)
    private String shopName;
}
