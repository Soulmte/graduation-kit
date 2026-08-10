package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 拒单入参（机构用）
 * 拒单必须写理由，用户能在预约详情里看到
 */
@Data
public class AppointmentRejectDTO {

    /**
     * 预约单ID
     */
    @NotNull(message = "预约单ID不能为空")
    private Long id;

    /**
     * 拒单理由
     */
    @NotBlank(message = "请填写拒单理由")
    @Size(max = 255, message = "拒单理由不能超过255字")
    private String rejectReason;
}
