package com.example.common.result;

import lombok.Getter;

/**
 * 统一返回状态码枚举
 *
 * 码段划分：
 *   200/4xx/500  沿用 HTTP 语义的通用码
 *   1xxx         用户与鉴权域
 *   2xxx         通用数据域
 *   4xxx         预约域（机构、服务项、排班、预约单、评价）
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

    // ---- 预约域 ----

    /**
     * 机构不存在
     */
    PROVIDER_NOT_EXIST(4001, "机构不存在"),

    /**
     * 已申请过机构
     */
    PROVIDER_EXIST(4002, "你已经申请过入驻了"),

    /**
     * 机构状态不允许该操作（待审核或已封禁）
     */
    PROVIDER_NOT_NORMAL(4003, "机构尚未通过审核或已被封禁"),

    /**
     * 服务项不存在
     */
    SERVICE_NOT_EXIST(4004, "服务项不存在"),

    /**
     * 服务项已下线
     */
    SERVICE_OFF_SALE(4005, "服务项已下线"),

    /**
     * 时段不存在
     */
    SLOT_NOT_EXIST(4006, "时段不存在"),

    /**
     * 时段已关闭，不接受预约
     */
    SLOT_CLOSED(4007, "该时段已关闭，请选择其他时间"),

    /**
     * 时段名额已满
     */
    SLOT_FULL(4008, "该时段名额已满，请选择其他时间"),

    /**
     * 时段已过期
     */
    SLOT_EXPIRED(4009, "该时段已过期，无法预约"),

    /**
     * 时段冲突（同服务项同时间已排过班）
     */
    SLOT_CONFLICT(4010, "该服务项在这个时间已经排过班了"),

    /**
     * 重复预约同一时段
     */
    APPOINTMENT_DUPLICATE(4011, "你已经预约过该时段了"),

    /**
     * 预约单不存在
     */
    APPOINTMENT_NOT_EXIST(4012, "预约单不存在"),

    /**
     * 当前预约状态不允许该操作
     */
    APPOINTMENT_STATUS_ERROR(4013, "当前预约状态不允许该操作"),

    /**
     * 该单已评价过
     */
    REVIEW_EXIST(4014, "该预约已经评价过了"),

    /**
     * 评价不存在
     */
    REVIEW_NOT_EXIST(4015, "评价不存在");
    
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
