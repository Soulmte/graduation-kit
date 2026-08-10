package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 评价回复入参（机构用）
 */
@Data
public class ReviewReplyDTO {

    /**
     * 评价ID
     */
    @NotNull(message = "评价ID不能为空")
    private Long id;

    /**
     * 回复内容
     */
    @NotBlank(message = "回复内容不能为空")
    @Size(max = 500, message = "回复内容不能超过500字")
    private String reply;
}
