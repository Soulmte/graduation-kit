package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 入驻申请入参
 * 不接受 userId 与 status：所属用户取当前登录用户，状态一律从待审核开始
 */
@Data
public class ProviderApplyDTO {

    /**
     * 机构名称
     */
    @NotBlank(message = "机构名称不能为空")
    @Size(max = 100, message = "机构名称过长")
    private String name;

    /**
     * 机构头像URL
     */
    @Size(max = 255, message = "图片地址过长")
    private String logo;

    /**
     * 机构简介
     */
    @Size(max = 500, message = "机构简介不能超过500字")
    private String description;

    /**
     * 到店地址
     */
    @Size(max = 255, message = "地址过长")
    private String address;

    /**
     * 联系电话
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String contactPhone;

    /**
     * 营业时间文案，如 09:00-18:00
     */
    @Size(max = 50, message = "营业时间文案过长")
    private String openTime;
}
