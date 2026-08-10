package com.example.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 批量生成排班入参（机构用）
 *
 * 手工一条条建时段太累，所以给一个日期区间加每天的营业时段，
 * 后端按服务项的 duration 自动切片。已存在的时段会跳过而不是报错，
 * 这样机构可以反复点"生成"来补齐新加的日子。
 */
@Data
public class SlotGenerateDTO {

    /**
     * 服务项ID
     */
    @NotNull(message = "请选择服务项")
    private Long serviceItemId;

    /**
     * 起始日期（含）
     */
    @NotNull(message = "起始日期不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    /**
     * 结束日期（含）。与起始日期最多相隔 30 天
     */
    @NotNull(message = "结束日期不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    /**
     * 每天营业开始时间
     */
    @NotNull(message = "营业开始时间不能为空")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime openTime;

    /**
     * 每天营业结束时间。最后一个时段的结束时间不会超过它
     */
    @NotNull(message = "营业结束时间不能为空")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime closeTime;

    /**
     * 每个时段可接待的名额
     */
    @NotNull(message = "名额不能为空")
    @Min(value = 1, message = "名额至少为1")
    @Max(value = 999, message = "名额过大")
    private Integer capacity = 1;
}
