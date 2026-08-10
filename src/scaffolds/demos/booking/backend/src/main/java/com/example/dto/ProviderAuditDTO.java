package com.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 机构审核入参（管理员用）
 * status 只允许改成正常或封禁，不允许改回待审核
 */
@Data
public class ProviderAuditDTO {

    /**
     * 机构ID
     */
    @NotNull(message = "机构ID不能为空")
    private Long id;

    /**
     * 目标状态：1-正常，2-已封禁
     */
    @NotNull(message = "目标状态不能为空")
    @Min(value = 1, message = "目标状态只能是1（通过）或2（封禁）")
    @Max(value = 2, message = "目标状态只能是1（通过）或2（封禁）")
    private Integer status;
}
