package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 退款申请入参（买家用）
 * 不接受金额：退款金额一律取订单总额，避免前端篡改
 */
@Data
public class RefundApplyDTO {

    /**
     * 订单ID
     */
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 退款理由
     */
    @NotBlank(message = "请填写退款理由")
    @Size(max = 255, message = "退款理由不能超过255字")
    private String reason;
}
