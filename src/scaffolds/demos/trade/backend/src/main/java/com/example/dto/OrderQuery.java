package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 订单查询条件
 * 三端共用：买家端由 Service 强制 userId=自己，商家端强制 merchantId=自己的店，管理端不限
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OrderQuery extends PageQuery {
    /**
     * 订单号（模糊查询）
     */
    private String orderNo;

    /**
     * 下单用户ID。买家端由后端覆盖，前端传了也不生效
     */
    private Long userId;

    /**
     * 商家ID。商家端由后端覆盖
     */
    private Long merchantId;

    /**
     * 状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-已退款。为空则不限
     */
    private Integer status;
}
