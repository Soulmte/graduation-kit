package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.dto.OperationLogQuery;
import com.example.entity.OperationLog;
import com.example.mapper.OperationLogMapper;
import com.example.service.OperationLogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 操作日志服务实现类
 */
@Slf4j
@Service
public class OperationLogServiceImpl extends ServiceImpl<OperationLogMapper, OperationLog> implements OperationLogService {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public IPage<OperationLog> pageQuery(OperationLogQuery query) {
        Page<OperationLog> page = new Page<>(query.getPageNum(), query.getPageSize());
        
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        
        // 用户名模糊查询
        if (StringUtils.hasText(query.getUsername())) {
            wrapper.like(OperationLog::getUsername, query.getUsername());
        }
        
        // 操作描述模糊查询
        if (StringUtils.hasText(query.getOperation())) {
            wrapper.like(OperationLog::getOperation, query.getOperation());
        }
        
        // 时间范围查询
        if (StringUtils.hasText(query.getStartTime())) {
            LocalDateTime startTime = LocalDateTime.parse(query.getStartTime(), FORMATTER);
            wrapper.ge(OperationLog::getCreateTime, startTime);
        }
        
        if (StringUtils.hasText(query.getEndTime())) {
            LocalDateTime endTime = LocalDateTime.parse(query.getEndTime(), FORMATTER);
            wrapper.le(OperationLog::getCreateTime, endTime);
        }
        
        // 排序
        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "username" -> wrapper.orderBy(true, isAsc, OperationLog::getUsername);
                case "operation" -> wrapper.orderBy(true, isAsc, OperationLog::getOperation);
                case "executeTime" -> wrapper.orderBy(true, isAsc, OperationLog::getExecuteTime);
                case "createTime" -> wrapper.orderBy(true, isAsc, OperationLog::getCreateTime);
                default -> wrapper.orderByDesc(OperationLog::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(OperationLog::getCreateTime);
        }
        
        return this.page(page, wrapper);
    }

    @Async
    @Override
    public void saveAsync(OperationLog operationLog) {
        try {
            this.save(operationLog);
        } catch (Exception e) {
            // 日志写入失败不能影响业务
            log.error("保存操作日志失败：", e);
        }
    }
}
