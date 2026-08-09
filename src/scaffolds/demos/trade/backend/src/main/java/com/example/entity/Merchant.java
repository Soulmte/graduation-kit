package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商家实体类
 * 一个用户最多开一个店，user_id 唯一
 */
@Data
@TableName("merchant")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Merchant {

    /** 状态：待审核 */
    public static final int STATUS_PENDING = 0;
    /** 状态：正常营业 */
    public static final int STATUS_NORMAL = 1;
    /** 状态：已封禁 */
    public static final int STATUS_BANNED = 2;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属用户ID
     */
    private Long userId;

    /**
     * 店铺名称
     */
    private String shopName;

    /**
     * 店铺头像URL
     */
    private String logo;

    /**
     * 店铺简介
     */
    private String description;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 状态：0-待审核，1-正常，2-已封禁
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

    /**
     * 店主用户名，联表查询时回填，不落库
     */
    @TableField(exist = false)
    private String username;
}
