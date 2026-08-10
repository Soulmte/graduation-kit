package com.example.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 预约单查询条件
 * 三端共用：买家端强制 userId=自己，机构端强制 providerId=自己的机构，管理端不限
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AppointmentQuery extends PageQuery {
    /**
     * 预约单号（模糊查询）
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
     * 状态：0-待确认，1-已确认，2-已完成，3-已取消，4-已拒绝，5-已失约。为空则不限
     */
    private Integer status;

    /**
     * 服务日期下限（含）
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFrom;

    /**
     * 服务日期上限（含）
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateTo;
}
