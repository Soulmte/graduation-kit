package com.example.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 排班时段查询条件
 * 买家端只看开放且未过期的时段，机构端看全部，由 Service 决定
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class SlotQuery extends PageQuery {
    /**
     * 服务项ID
     */
    private Long serviceItemId;

    /**
     * 机构ID
     */
    private Long providerId;

    /**
     * 日期下限（含）
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateFrom;

    /**
     * 日期上限（含）
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateTo;

    /**
     * 状态：0-已关闭，1-开放。为空则不限
     */
    private Integer status;
}
