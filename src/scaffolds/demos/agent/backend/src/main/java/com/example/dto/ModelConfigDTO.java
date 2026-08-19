package com.example.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 模型配置新增/编辑入参
 *
 * apiKey 的约定：列表接口返回的是掩码值（sk-***abc），前端不可能拿到原文，
 * 所以编辑时该字段留空表示"沿用原来的 Key"，只有填了新值才覆盖。
 * 想清空 Key 就填一个空格再提交，Service 会 trim 成空串写入。
 */
@Data
public class ModelConfigDTO {

    /**
     * 主键ID，新增时为空
     */
    private Long id;

    /**
     * 配置名称
     */
    @NotBlank(message = "配置名称不能为空")
    @Size(max = 100, message = "配置名称过长")
    private String name;

    /**
     * 厂商标识：deepseek/openai/qwen/ollama/other
     */
    @NotBlank(message = "请选择厂商")
    @Size(max = 50, message = "厂商标识过长")
    private String provider;

    /**
     * 接口地址，只填到域名，如 https://api.deepseek.com
     */
    @NotBlank(message = "接口地址不能为空")
    @Pattern(regexp = "^https?://.+", message = "接口地址需以 http:// 或 https:// 开头")
    @Size(max = 255, message = "接口地址过长")
    private String baseUrl;

    /**
     * API Key。编辑时留空表示不修改
     */
    @Size(max = 255, message = "API Key 过长")
    private String apiKey;

    /**
     * 模型名，如 deepseek-v4-flash
     */
    @NotBlank(message = "模型名不能为空")
    @Size(max = 100, message = "模型名过长")
    private String model;

    /**
     * 采样温度 0.00~2.00
     */
    @NotNull(message = "请设置采样温度")
    @DecimalMin(value = "0.00", message = "采样温度不能小于 0")
    @DecimalMax(value = "2.00", message = "采样温度不能大于 2")
    private BigDecimal temperature;

    /**
     * 单次回复最大 token 数
     */
    @NotNull(message = "请设置最大 token 数")
    @Min(value = 1, message = "最大 token 数不能小于 1")
    @Max(value = 32768, message = "最大 token 数不能超过 32768")
    private Integer maxTokens;

    /**
     * 请求超时（秒）
     */
    @NotNull(message = "请设置请求超时")
    @Min(value = 5, message = "超时不能小于 5 秒")
    @Max(value = 300, message = "超时不能超过 300 秒")
    private Integer timeout;

    /**
     * 状态：0-停用，1-启用
     */
    @NotNull(message = "请选择状态")
    @Min(value = 0, message = "状态取值不正确")
    @Max(value = 1, message = "状态取值不正确")
    private Integer status;

    /**
     * 是否设为默认：0-否，1-是。置 1 时 Service 会把其他条降为 0
     */
    @Min(value = 0, message = "默认标记取值不正确")
    @Max(value = 1, message = "默认标记取值不正确")
    private Integer isDefault = 0;

    /**
     * 备注
     */
    @Size(max = 255, message = "备注不能超过255字")
    private String remark;
}
