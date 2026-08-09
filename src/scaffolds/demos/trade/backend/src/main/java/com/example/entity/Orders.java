package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单实体类
 * 类名与表名都用 Orders，order 是 MySQL 保留字
 *
 * 状态流转：
 *   0 待支付 --支付--> 1 待发货 --发货--> 2 待收货 --确认收货--> 3 已完成
 *   0 待支付 --取消--> 4 已取消
 *   1/2 --申请退款--> 5 退款中 --同意--> 6 已退款，拒绝则回到原状态
 */
@Data
@TableName("orders")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Orders {

    /** 待支付 */
    public static final int STATUS_UNPAID = 0;
    /** 待发货 */
    public static final int STATUS_PAID = 1;
    /** 待收货 */
    public static final int STATUS_SHIPPED = 2;
    /** 已完成 */
    public static final int STATUS_FINISHED = 3;
    /** 已取消 */
    public static final int STATUS_CANCELLED = 4;
    /** 退款中 */
    public static final int STATUS_REFUNDING = 5;
    /** 已退款 */
    public static final int STATUS_REFUNDED = 6;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单号
     */
    private String orderNo;

    /**
     * 下单用户ID
     */
    private Long userId;

    /**
     * 商家ID，一单只属一家，购物车跨店时拆单
     */
    private Long merchantId;

    /**
     * 订单总金额（元）
     */
    private BigDecimal totalAmount;

    /**
     * 状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-已退款
     */
    private Integer status;

    /**
     * 收货人姓名
     */
    private String receiverName;

    /**
     * 收货人电话
     */
    private String receiverPhone;

    /**
     * 收货地址
     */
    private String receiverAddr;

    /**
     * 买家备注
     */
    private String remark;

    /**
     * 支付时间
     */
    private LocalDateTime payTime;

    /**
     * 发货时间
     */
    private LocalDateTime shipTime;

    /**
     * 完成时间
     */
    private LocalDateTime finishTime;

    /**
     * 取消时间
     */
    private LocalDateTime cancelTime;

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

    // ---- 以下字段联表回填，不落库 ----

    /**
     * 订单明细
     */
    @TableField(exist = false)
    private List<OrderItem> items;

    /**
     * 下单人用户名
     */
    @TableField(exist = false)
    private String username;

    /**
     * 店铺名称
     */
    @TableField(exist = false)
    private String shopName;
}
