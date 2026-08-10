package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 服务评价实体类
 * 一单一评，只有已完成的预约能评。providerId 与 serviceItemId 冗余存，
 * 算机构均分与服务均分时不用再联预约单表。
 */
@Data
@TableName("review")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Review {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 预约单ID
     */
    private Long appointmentId;

    /**
     * 评价用户ID
     */
    private Long userId;

    /**
     * 机构ID
     */
    private Long providerId;

    /**
     * 服务项ID
     */
    private Long serviceItemId;

    /**
     * 评分：1~5 星
     */
    private Integer rating;

    /**
     * 评价内容
     */
    private String content;

    /**
     * 机构回复
     */
    private String reply;

    /**
     * 回复时间
     */
    private LocalDateTime replyTime;

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
     * 评价人用户名
     */
    @TableField(exist = false)
    private String username;

    /**
     * 评价人头像
     */
    @TableField(exist = false)
    private String avatar;

    /**
     * 服务名称
     */
    @TableField(exist = false)
    private String serviceName;
}
