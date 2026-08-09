package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付流水实体类
 * 模拟支付：不接真实渠道，但保留完整流水，便于论文里讲清支付链路
 * 无逻辑删除字段，流水只增不删
 */
@Data
@TableName("payment")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Payment {

    /** 待支付 */
    public static final int STATUS_PENDING = 0;
    /** 支付成功 */
    public static final int STATUS_SUCCESS = 1;
    /** 支付失败 */
    public static final int STATUS_FAILED = 2;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 支付流水号
     */
    private String payNo;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 付款用户ID
     */
    private Long userId;

    /**
     * 支付金额（元）
     */
    private BigDecimal amount;

    /**
     * 支付方式：mock/alipay/wechat
     */
    private String method;

    /**
     * 状态：0-待支付，1-成功，2-失败
     */
    private Integer status;

    /**
     * 支付完成时间
     */
    private LocalDateTime payTime;

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
     * 订单号，联表回填，不落库
     */
    @TableField(exist = false)
    private String orderNo;
}
