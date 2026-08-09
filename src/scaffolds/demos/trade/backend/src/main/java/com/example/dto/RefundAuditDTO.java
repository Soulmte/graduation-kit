package com.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 退款审核入参（商家或管理员用）
 * 审核人取当前登录用户，不接受前端传入
 */
@Data
public class RefundAuditDTO {

    /**
     * 退款单ID
     */
    @NotNull(message = "退款单ID不能为空")
    private Long id;

    /**
     * 审核结果：1-同意，2-拒绝
     */
    @NotNull(message = "审核结果不能为空")
    @Min(value = 1, message = "审核结果只能是1（同意）或2（拒绝）")
    @Max(value = 2, message = "审核结果只能是1（同意）或2（拒绝）")
    private Integer status;

    /**
     * 审核备注
     */
    @Size(max = 255, message = "审核备注不能超过255字")
    private String auditRemark;
}
