package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体类
 * 金额统一用 BigDecimal，不用 double，避免浮点误差
 */
@Data
@TableName("product")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Product {

    /** 状态：下架 */
    public static final int STATUS_OFF = 0;
    /** 状态：上架 */
    public static final int STATUS_ON = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属商家ID
     */
    private Long merchantId;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 商品名称
     */
    private String name;

    /**
     * 封面图URL
     */
    private String cover;

    /**
     * 商品详情（富文本）
     */
    private String description;

    /**
     * 单价（元）
     */
    private BigDecimal price;

    /**
     * 库存
     */
    private Integer stock;

    /**
     * 累计销量
     */
    private Integer sales;

    /**
     * 状态：0-下架，1-上架
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
     * 分类名称，联表查询时回填，不落库
     */
    @TableField(exist = false)
    private String categoryName;

    /**
     * 店铺名称，联表查询时回填，不落库
     */
    @TableField(exist = false)
    private String shopName;
}
