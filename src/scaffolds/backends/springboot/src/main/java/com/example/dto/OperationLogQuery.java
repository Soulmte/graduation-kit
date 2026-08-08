package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 操作日志查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class OperationLogQuery extends PageQuery {
    /**
     * 操作用户（模糊查询）
     */
    private String username;
    
    /**
     * 操作描述（模糊查询）
     */
    private String operation;
    
    /**
     * 开始时间
     */
    private String startTime;
    
    /**
     * 结束时间
     */
    private String endTime;
}
