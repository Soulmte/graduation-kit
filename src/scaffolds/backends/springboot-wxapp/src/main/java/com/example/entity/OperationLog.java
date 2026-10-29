package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志实体类
 */
@Data
@TableName("operation_log")
public class OperationLog {
    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 操作用户名
     */
    private String username;
    
    /**
     * 操作描述
     */
    private String operation;
    
    /**
     * 方法名
     */
    private String method;
    
    /**
     * 请求参数
     */
    private String params;
    
    /**
     * 执行时长（毫秒）
     */
    private Long executeTime;
    
    /**
     * IP地址
     */
    private String ip;
    
    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
