package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.OperationLogQuery;
import com.example.entity.OperationLog;
import com.example.service.OperationLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 操作日志控制器
 * 日志属于管理数据，整类接口仅管理员可访问
 */
@RestController
@RequestMapping("/api/log")
@RequireAdmin
public class OperationLogController {
    
    @Autowired
    private OperationLogService operationLogService;
    
    /**
     * 分页查询操作日志（带条件）
     */
    @PostMapping("/pageQuery")
    @Log("分页查询操作日志")
    public Result<IPage<OperationLog>> pageQuery(@RequestBody @Valid OperationLogQuery query) {
        return Result.success(operationLogService.pageQuery(query));
    }
    
    /**
     * 查询所有操作日志
     */
    @GetMapping("/listAll")
    public Result<List<OperationLog>> listAll() {
        return Result.success(operationLogService.list());
    }
    
    /**
     * 根据ID查询操作日志
     */
    @GetMapping("/getById/{id}")
    public Result<OperationLog> getById(@PathVariable Long id) {
        return Result.success(operationLogService.getById(id));
    }
    
    /**
     * 删除操作日志
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除操作日志")
    public Result<Void> deleteById(@PathVariable Long id) {
        operationLogService.removeById(id);
        return Result.success("删除成功");
    }
    
    /**
     * 批量删除操作日志
     */
    @DeleteMapping("/deleteBatch")
    @Log("批量删除操作日志")
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        operationLogService.removeByIds(ids);
        return Result.success("批量删除成功");
    }
}
