package com.example.common.exception;

import com.example.common.result.Result;
import com.example.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.error("业务异常：{}", e.getMessage());
        return Result.build(e.getCode(), e.getMessage());
    }
    
    /**
     * 处理参数校验异常（@Valid 校验失败）
     * 取第一个字段的提示信息返回，前端直接弹展示
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidException(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : ResultCode.PARAM_ERROR.getMessage();
        log.warn("参数校验失败：{}", message);
        return Result.build(ResultCode.PARAM_ERROR.getCode(), message);
    }

    /**
     * 处理唯一索引冲突
     * 并发插入重复数据时由数据库约束兑住，这里翻译为友好提示
     */
    @ExceptionHandler(DuplicateKeyException.class)
    public Result<Void> handleDuplicateKeyException(DuplicateKeyException e) {
        log.warn("数据重复：{}", e.getMessage());
        return Result.error(ResultCode.DATA_EXIST);
    }

    /**
     * 处理运行时异常
     * 不将异常详情返回给前端，避免泄露内部实现
     */
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        log.error("运行时异常：", e);
        return Result.error(ResultCode.ERROR);
    }
    
    /**
     * 处理所有异常
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常：", e);
        return Result.error(ResultCode.ERROR);
    }
}
