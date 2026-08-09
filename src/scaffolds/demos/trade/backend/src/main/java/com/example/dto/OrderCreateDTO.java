package com.example.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * 创建订单入参
 *
 * 支持两种下单来源，二者只能选一个：
 *   1. 购物车结算：传 cartItemIds，后端按这些条目建单
 *   2. 商品页直接买：传 productId + quantity
 *
 * 金额一律由后端按商品表现价计算，不接受前端传金额。
 */
@Data
public class OrderCreateDTO {

    /**
     * 购物车条目ID列表（购物车结算时传）
     */
    private List<Long> cartItemIds;

    /**
     * 商品ID（直接购买时传）
     */
    private Long productId;

    /**
     * 购买数量（直接购买时传）
     */
    @Min(value = 1, message = "数量不能小于1")
    @Max(value = 999, message = "单次购买数量不能超过999")
    private Integer quantity;

    /**
     * 收货人姓名
     */
    @NotBlank(message = "收货人姓名不能为空")
    @Size(max = 50, message = "收货人姓名过长")
    private String receiverName;

    /**
     * 收货人电话
     */
    @NotBlank(message = "收货人电话不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String receiverPhone;

    /**
     * 收货地址
     */
    @NotBlank(message = "收货地址不能为空")
    @Size(max = 255, message = "收货地址过长")
    private String receiverAddr;

    /**
     * 买家备注
     */
    @Size(max = 255, message = "备注过长")
    private String remark;

    /**
     * 是否走购物车结算
     */
    public boolean fromCart() {
        return cartItemIds != null && !cartItemIds.isEmpty();
    }
}
