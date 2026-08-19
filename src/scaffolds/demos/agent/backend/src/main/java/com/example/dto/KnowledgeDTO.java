package com.example.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 知识条目新增/编辑入参
 */
@Data
public class KnowledgeDTO {

    /**
     * 主键ID，新增时为空
     */
    private Long id;

    /**
     * 归属智能体ID。留空表示全局共享，所有智能体都能检索到
     */
    private Long agentId;

    /**
     * 条目标题
     */
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题过长")
    private String title;

    /**
     * 条目正文，命中后拼进提示词
     */
    @NotBlank(message = "正文不能为空")
    @Size(max = 5000, message = "正文不能超过5000字")
    private String content;

    /**
     * 关键词，逗号分隔
     */
    @Size(max = 255, message = "关键词不能超过255字")
    private String keywords;

    /**
     * 状态：0-停用，1-启用
     */
    @NotNull(message = "请选择状态")
    @Min(value = 0, message = "状态取值不正确")
    @Max(value = 1, message = "状态取值不正确")
    private Integer status;
}
