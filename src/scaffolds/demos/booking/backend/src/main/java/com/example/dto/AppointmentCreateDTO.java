package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建预约入参
 *
 * 只收时段ID：服务项、机构、日期时间、价格全部由后端根据时段反查，
 * 前端传什么价格都不采纳，避免改包改价。
 */
@Data
public class AppointmentCreateDTO {

    /**
     * 时段ID
     */
    @NotNull(message = "请选择预约时段")
    private Long timeSlotId;

    /**
     * 联系人姓名
     */
    @NotBlank(message = "联系人姓名不能为空")
    @Size(max = 50, message = "联系人姓名过长")
    private String contactName;

    /**
     * 联系电话
     */
    @NotBlank(message = "联系电话不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String contactPhone;

    /**
     * 用户备注
     */
    @Size(max = 255, message = "备注不能超过255字")
    private String remark;
}
