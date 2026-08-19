package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 模型配置实体类
 *
 * 任何兼容 OpenAI 协议的服务都填这张表：DeepSeek、通义、Kimi、本地 Ollama。
 * baseUrl 只存到域名（如 https://api.deepseek.com），
 * /v1/chat/completions 由 LlmClient 拼接，换厂商时不用改代码。
 *
 * apiKey 明文入库仅为毕设演示。出库时 Service 会掩码成 sk-***abc，
 * 前端永远拿不到完整值；提交表单时留空表示沿用原值。
 */
@Data
@TableName("model_config")
@JsonIgnoreProperties(ignoreUnknown = true)
public class ModelConfig {

    /** 停用 */
    public static final int STATUS_OFF = 0;
    /** 启用 */
    public static final int STATUS_ON = 1;

    /** 非默认 */
    public static final int DEFAULT_NO = 0;
    /** 默认，全局仅一条 */
    public static final int DEFAULT_YES = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 配置名称，如 DeepSeek 快速版
     */
    private String name;

    /**
     * 厂商标识：deepseek/openai/qwen/ollama/other
     */
    private String provider;

    /**
     * 接口地址，如 https://api.deepseek.com
     */
    private String baseUrl;

    /**
     * API Key（本地模型可为空）
     */
    private String apiKey;

    /**
     * 模型名，如 deepseek-v4-flash
     */
    private String model;

    /**
     * 采样温度 0.00~2.00，越大越发散
     */
    private BigDecimal temperature;

    /**
     * 单次回复最大 token 数
     */
    private Integer maxTokens;

    /**
     * 请求超时（秒）
     */
    private Integer timeout;

    /**
     * 状态：0-停用，1-启用
     */
    private Integer status;

    /**
     * 是否默认：0-否，1-是（全局仅一条）
     */
    private Integer isDefault;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 逻辑删除标记：0-未删除，1-已删除
     */
    @TableLogic
    private Integer deleted;

    /**
     * 是否已填 API Key。掩码后前端没法判断有没有值，单独给个标记。
     */
    @TableField(exist = false)
    private Boolean keyConfigured;
}
