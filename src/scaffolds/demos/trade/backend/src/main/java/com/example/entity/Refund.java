package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 退款申请实体类
 * 一单可多次申请：被拒后买家可以重新提交，所以 order_id 不做唯一约束
 */
@Data
@TableName("refund")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Refund {

    /** 待审核 */
    public static final int STATUS_PENDING = 0;
    /** 已同意 */
    public static final int STATUS_APPROVED = 1;
    /** 已拒绝 */
    public static final int STATUS_REJECTED = 2;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 退款单号
     */
    private String refundNo;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 申请用户ID
     */
    private Long userId;

    /**
     * 退款金额（元）
     */
    private BigDecimal amount;

    /**
     * 退款理由
     */
    private String reason;

    /**
     * 状态：0-待审核，1-已同意，2-已拒绝
     */
    private Integer status;

    /**
     * 审核人用户名
     */
    private String auditBy;

    /**
     * 审核备注
     */
    private String auditRemark;

    /**
     * 审核时间
     */
    private LocalDateTime auditTime;

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
     * 订单号
     */
    @TableField(exist = false)
    private String orderNo;

    /**
     * 申请人用户名
     */
    @TableField(exist = false)
    private String username;
}
