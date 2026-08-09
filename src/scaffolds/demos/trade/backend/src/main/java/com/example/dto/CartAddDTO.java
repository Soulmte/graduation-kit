package com.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 加入购物车入参
 * 不接受 userId，一律取当前登录用户
 */
@Data
public class CartAddDTO {
    /**
     * 商品ID
     */
    @NotNull(message = "商品ID不能为空")
    private Long productId;

    /**
     * 数量
     */
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量不能小于1")
    @Max(value = 999, message = "单次购买数量不能超过999")
    private Integer quantity = 1;
}
