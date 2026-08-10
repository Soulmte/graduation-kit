package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * 排班时段实体类
 *
 * 这是预约类系统的核心：卖的不是货，而是"某个时间段的服务能力"。
 * capacity 对应商品的库存，bookedCount 是已占用名额，两者分开存，
 * 抢名额时用 bookedCount < capacity 做条件更新，靠行锁挡并发。
 */
@Data
@TableName("time_slot")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TimeSlot {

    /** 状态：已关闭，不接受预约 */
    public static final int STATUS_CLOSED = 0;
    /** 状态：开放预约 */
    public static final int STATUS_OPEN = 1;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属机构ID，冗余存储，方便按机构查排班
     */
    private Long providerId;

    /**
     * 服务项ID
     */
    private Long serviceItemId;

    /**
     * 服务日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate slotDate;

    /**
     * 开始时间
     */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    /**
     * 结束时间，等于开始时间加服务时长
     */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    /**
     * 可接待名额
     */
    private Integer capacity;

    /**
     * 已预约名额
     */
    private Integer bookedCount;

    /**
     * 状态：0-已关闭，1-开放
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

    // ---- 以下字段联表或计算回填，不落库 ----

    /**
     * 服务名称
     */
    @TableField(exist = false)
    private String serviceName;

    /**
     * 剩余名额 = capacity - bookedCount
     */
    @TableField(exist = false)
    private Integer remain;

    /**
     * 是否已过当前时间。前端据此把时段置灰
     */
    @TableField(exist = false)
    private Boolean expired;
}
