package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 服务项实体类
 *
 * duration 是单次服务时长，机构排班时按它自动算时段的结束时间，
 * 所以改了时长只影响以后新排的班，已有时段不会跟着变。
 */
@Data
@TableName("service_item")
@JsonIgnoreProperties(ignoreUnknown = true)
public class ServiceItem {

    /** 状态：已下线 */
    public static final int STATUS_OFF = 0;
    /** 状态：已上线 */
    public static final int STATUS_ON = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属机构ID
     */
    private Long providerId;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 服务名称
     */
    private String name;

    /**
     * 封面图URL
     */
    private String cover;

    /**
     * 服务详情（富文本）
     */
    private String description;

    /**
     * 单次价格（元）
     */
    private BigDecimal price;

    /**
     * 单次服务时长（分钟）
     */
    private Integer duration;

    /**
     * 累计预约人数
     */
    private Integer booked;

    /**
     * 状态：0-下线，1-上线
     */
    private Integer status;

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

    // ---- 以下字段联表回填，不落库 ----

    /**
     * 分类名称
     */
    @TableField(exist = false)
    private String categoryName;

    /**
     * 机构名称
     */
    @TableField(exist = false)
    private String providerName;

    /**
     * 平均评分，列表页展示用
     */
    @TableField(exist = false)
    private BigDecimal avgRating;
}
