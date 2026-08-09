package com.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 发货入参（商家用）
 * demo 不接物流，只记录发货动作与时间。需要快递单号可在此加字段并同步改表
 */
@Data
public class OrderShipDTO {

    /**
     * 订单ID
     */
    @NotNull(message = "订单ID不能为空")
    private Long id;
}
