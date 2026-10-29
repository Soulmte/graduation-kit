package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.OperationLogQuery;
import com.example.entity.OperationLog;

/**
 * 操作日志服务接口
 */
public interface OperationLogService extends IService<OperationLog> {
    /**
     * 分页查询操作日志（带条件）
     */
    IPage<OperationLog> pageQuery(OperationLogQuery query);

    /**
     * 异步保存操作日志
     * 由LogAspect调用，不影响主流程响应速度
     */
    void saveAsync(OperationLog operationLog);
}
