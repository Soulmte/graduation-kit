package com.example.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 智能体新增/编辑入参（基础信息，不含画布）
 *
 * 画布单独走 PUT /api/agent/{id}/graph，因为两者的编辑场景是分开的：
 * 基础信息在列表页弹窗改，画布在编排页拖，混在一个接口里容易互相覆盖。
 */
@Data
public class AgentSaveDTO {

    /**
     * 主键ID，新增时为空
     */
    private Long id;

    /**
     * 智能体名称
     */
    @NotBlank(message = "智能体名称不能为空")
    @Size(max = 100, message = "智能体名称过长")
    private String name;

    /**
     * 头像URL
     */
    @Size(max = 255, message = "头像地址过长")
    private String avatar;

    /**
     * 简介，前台卡片上展示
     */
    @Size(max = 500, message = "简介不能超过500字")
    private String description;

    /**
     * 开场白，新建会话时作为第一条回复
     */
    @Size(max = 500, message = "开场白不能超过500字")
    private String greeting;

    /**
     * 默认模型配置ID
     */
    @NotNull(message = "请选择默认模型")
    private Long modelConfigId;

    /**
     * 前台排序值，越小越靠前
     */
    @Min(value = 0, message = "排序值不能小于 0")
    @Max(value = 9999, message = "排序值不能超过 9999")
    private Integer sort = 0;
}
