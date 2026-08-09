package com.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 修改购物车数量入参
 * 归属校验在 Service 层做：只能改自己车里的条目
 */
@Data
public class CartUpdateDTO {
    /**
     * 购物车条目ID
     */
    @NotNull(message = "购物车条目ID不能为空")
    private Long id;

    /**
     * 修改后的数量
     */
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量不能小于1，要移除请调用删除接口")
    @Max(value = 999, message = "单次购买数量不能超过999")
    private Integer quantity;
}
