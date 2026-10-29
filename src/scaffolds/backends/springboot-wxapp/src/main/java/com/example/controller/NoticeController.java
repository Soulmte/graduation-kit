package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.common.util.UserContext;
import com.example.dto.NoticeQuery;
import com.example.entity.Notice;
import com.example.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公告控制器
 */
@RestController
@RequestMapping("/api/notice")
public class NoticeController {
    
    @Autowired
    private NoticeService noticeService;
    
    /**
     * 创建公告
     */
    @PostMapping("/add")
    @Log("创建公告")
    @RequireAdmin
    public Result<Void> add(@RequestBody Notice notice) {
        // 发布人取当前登录用户，不信任前端传入
        notice.setCreateBy(UserContext.getUsername());
        noticeService.save(notice);
        return Result.success("创建成功");
    }
    
    /**
     * 分页查询公告列表（带条件）
     */
    @PostMapping("/pageQuery")
    @Log("分页查询公告")
    public Result<IPage<Notice>> pageQuery(@RequestBody @Valid NoticeQuery query) {
        return Result.success(noticeService.pageQuery(query));
    }
    
    /**
     * 查询所有公告列表
     */
    @GetMapping("/listAll")
    @Log("查询公告列表")
    public Result<List<Notice>> listAll() {
        return Result.success(noticeService.list());
    }
    
    /**
     * 根据ID查询公告
     */
    @GetMapping("/getById/{id}")
    @Log("查询公告详情")
    public Result<Notice> getById(@PathVariable Long id) {
        return Result.success(noticeService.getById(id));
    }
    
    /**
     * 更新公告
     */
    @PutMapping("/update")
    @Log("更新公告")
    @RequireAdmin
    public Result<Void> update(@RequestBody Notice notice) {
        noticeService.updateById(notice);
        return Result.success("更新成功");
    }
    
    /**
     * 删除公告
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除公告")
    @RequireAdmin
    public Result<Void> deleteById(@PathVariable Long id) {
        noticeService.removeById(id);
        return Result.success("删除成功");
    }

    /**
     * 批量删除公告
     */
    @DeleteMapping("/deleteBatch")
    @Log("批量删除公告")
    @RequireAdmin
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        noticeService.removeByIds(ids);
        return Result.success("批量删除成功");
    }
}
