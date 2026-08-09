package com.example.common.result;

import lombok.Getter;

/**
 * 统一返回状态码枚举
 *
 * 码段划分：
 *   200/4xx/500  沿用 HTTP 语义的通用码
 *   1xxx         用户与鉴权域
 *   2xxx         通用数据域
 *   3xxx         交易域（商家、商品、购物车、订单、支付、退款）
 */
@Getter
public enum ResultCode {
    
    /**
     * 成功
     */
    SUCCESS(200, "操作成功"),
    
    /**
     * 失败
     */
    ERROR(500, "操作失败"),
    
    /**
     * 参数错误
     */
    PARAM_ERROR(400, "参数错误"),
    
    /**
     * 未授权
     */
    UNAUTHORIZED(401, "未授权，请先登录"),
    
    /**
     * 禁止访问
     */
    FORBIDDEN(403, "权限不足，禁止访问"),
    
    /**
     * 资源不存在
     */
    NOT_FOUND(404, "资源不存在"),
    
    /**
     * 用户名或密码错误
     */
    LOGIN_ERROR(1001, "用户名或密码错误"),
    
    /**
     * 用户名已存在
     */
    USERNAME_EXIST(1002, "用户名已存在"),

    /**
     * 原密码错误
     */
    PASSWORD_ERROR(1004, "原密码错误"),

    /**
     * 数据已存在
     */
    DATA_EXIST(2001, "数据已存在"),
    
    /**
     * 数据不存在
     */
    DATA_NOT_EXIST(2002, "数据不存在"),

    // ---- 交易域 ----

    /**
     * 店铺不存在
     */
    MERCHANT_NOT_EXIST(3001, "店铺不存在"),

    /**
     * 已申请过店铺
     */
    MERCHANT_EXIST(3002, "你已经申请过店铺了"),

    /**
     * 店铺状态不允许该操作（待审核或已封禁）
     */
    MERCHANT_NOT_NORMAL(3003, "店铺尚未通过审核或已被封禁"),

    /**
     * 商品不存在
     */
    PRODUCT_NOT_EXIST(3004, "商品不存在"),

    /**
     * 商品已下架
     */
    PRODUCT_OFF_SALE(3005, "商品已下架"),

    /**
     * 库存不足
     */
    STOCK_NOT_ENOUGH(3006, "商品库存不足"),

    /**
     * 购物车为空
     */
    CART_EMPTY(3007, "请先选择要购买的商品"),

    /**
     * 订单不存在
     */
    ORDER_NOT_EXIST(3008, "订单不存在"),

    /**
     * 当前订单状态不允许该操作
     */
    ORDER_STATUS_ERROR(3009, "当前订单状态不允许该操作"),

    /**
     * 退款申请已存在，等待审核中
     */
    REFUND_PENDING_EXIST(3010, "该订单已有待审核的退款申请"),

    /**
     * 退款单不存在
     */
    REFUND_NOT_EXIST(3011, "退款申请不存在");
    
    /**
     * 状态码
     */
    private final Integer code;
    
    /**
     * 返回消息
     */
    private final String message;
    
    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
