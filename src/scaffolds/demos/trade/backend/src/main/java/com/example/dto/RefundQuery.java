package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 退款申请查询条件
 * 买家端由 Service 强制 userId=自己，商家端按自己店下的订单过滤
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class RefundQuery extends PageQuery {
    /**
     * 退款单号（模糊查询）
     */
    private String refundNo;

    /**
     * 申请用户ID。买家端由后端覆盖
     */
    private Long userId;

    /**
     * 状态：0-待审核，1-已同意，2-已拒绝。为空则不限
     */
    private Integer status;
}
