package com.example.common.result;

import lombok.Getter;

/**
 * 统一返回状态码枚举
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

    // ---- 以下为智能体编排域的状态码 ----

    /**
     * 模型配置不存在
     */
    MODEL_NOT_EXIST(5001, "模型配置不存在"),

    /**
     * 模型配置已停用
     */
    MODEL_DISABLED(5002, "模型配置已停用，请先启用"),

    /**
     * 未配置 API Key
     */
    MODEL_KEY_MISSING(5003, "该模型还没填 API Key，请到模型配置里补上"),

    /**
     * 调用模型失败
     */
    MODEL_CALL_FAILED(5004, "调用模型失败"),

    /**
     * 智能体不存在
     */
    AGENT_NOT_EXIST(5005, "智能体不存在"),

    /**
     * 智能体未发布
     */
    AGENT_NOT_PUBLISHED(5006, "智能体还未发布，暂不能对话"),

    /**
     * 编排结构不合法
     */
    GRAPH_INVALID(5007, "编排结构不合法"),

    /**
     * 会话不存在
     */
    CONVERSATION_NOT_EXIST(5008, "会话不存在"),

    /**
     * 知识条目不存在
     */
    KNOWLEDGE_NOT_EXIST(5009, "知识条目不存在");
    
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
