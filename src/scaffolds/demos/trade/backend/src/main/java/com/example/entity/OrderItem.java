package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单明细实体类
 * 商品名、封面、单价都是下单那一刻的快照。
 * 商品后续改名改价，旧订单显示的仍是成交时的信息，这是刻意的冗余。
 */
@Data
@TableName("order_item")
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderItem {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 商品ID
     */
    private Long productId;

    /**
     * 下单时的商品名称（快照）
     */
    private String productName;

    /**
     * 下单时的封面图（快照）
     */
    private String productCover;

    /**
     * 下单时的单价（快照）
     */
    private BigDecimal price;

    /**
     * 购买数量
     */
    private Integer quantity;

    /**
     * 小计 = price * quantity
     */
    private BigDecimal subtotal;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
