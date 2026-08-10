package com.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发表评价入参
 * 只收预约单ID：机构与服务项由后端从单子上反查，防止评到别家头上
 */
@Data
public class ReviewCreateDTO {

    /**
     * 预约单ID
     */
    @NotNull(message = "预约单ID不能为空")
    private Long appointmentId;

    /**
     * 评分：1~5 星
     */
    @NotNull(message = "请打分")
    @Min(value = 1, message = "评分最低1星")
    @Max(value = 5, message = "评分最高5星")
    private Integer rating;

    /**
     * 评价内容
     */
    @Size(max = 500, message = "评价内容不能超过500字")
    private String content;
}
