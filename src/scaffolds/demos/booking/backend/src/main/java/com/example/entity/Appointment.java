package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 预约单实体类
 *
 * 状态流转：
 *   0 待确认 --机构接单--> 1 已确认 --到店核销--> 2 已完成（可评价）
 *   0 待确认 --机构拒单--> 4 已拒绝（释放名额）
 *   0 / 1 --用户取消--> 3 已取消（释放名额）
 *   1 已确认 --机构标记--> 5 已失约（时间已过，不释放名额）
 *
 * 服务名、价格、日期时间都存了快照：预约单是历史凭证，
 * 机构后来改名改价或删时段，旧单显示的仍是预约时的信息。
 */
@Data
@TableName("appointment")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Appointment {

    /** 待确认 */
    public static final int STATUS_PENDING = 0;
    /** 已确认 */
    public static final int STATUS_CONFIRMED = 1;
    /** 已完成 */
    public static final int STATUS_FINISHED = 2;
    /** 已取消 */
    public static final int STATUS_CANCELLED = 3;
    /** 已拒绝 */
    public static final int STATUS_REJECTED = 4;
    /** 已失约 */
    public static final int STATUS_NO_SHOW = 5;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 预约单号
     */
    private String appointmentNo;

    /**
     * 预约用户ID
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
     * 时段ID
     */
    private Long timeSlotId;

    /**
     * 预约时的服务名称（快照）
     */
    private String serviceName;

    /**
     * 预约时的封面图（快照）
     */
    private String serviceCover;

    /**
     * 预约时的价格（快照，单位元）
     */
    private BigDecimal price;

    /**
     * 服务日期（快照）
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate slotDate;

    /**
     * 开始时间（快照）
     */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    /**
     * 结束时间（快照）
     */
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    /**
     * 状态：0-待确认，1-已确认，2-已完成，3-已取消，4-已拒绝，5-已失约
     */
    private Integer status;

    /**
     * 联系人姓名
     */
    private String contactName;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 用户备注
     */
    private String remark;

    /**
     * 拒单理由
     */
    private String rejectReason;

    /**
     * 确认时间
     */
    private LocalDateTime confirmTime;

    /**
     * 核销完成时间
     */
    private LocalDateTime finishTime;

    /**
     * 取消时间
     */
    private LocalDateTime cancelTime;

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
     * 预约人用户名
     */
    @TableField(exist = false)
    private String username;

    /**
     * 机构名称
     */
    @TableField(exist = false)
    private String providerName;

    /**
     * 是否已评价，买家端「去评价」按钮据此显示
     */
    @TableField(exist = false)
    private Boolean reviewed;
}
