package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireProvider;
import com.example.common.result.Result;
import com.example.dto.SlotGenerateDTO;
import com.example.dto.SlotQuery;
import com.example.entity.TimeSlot;
import com.example.service.TimeSlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 排班时段控制器
 *
 * 买家端只需要"某个服务项接下来哪几天还能约"，所以给的是不分页的列表接口；
 * 机构端要翻历史排班，走分页。
 */
@RestController
@RequestMapping("/api/timeSlot")
public class TimeSlotController {

    @Autowired
    private TimeSlotService timeSlotService;

    /**
     * 买家端查可约时段。日期区间不传时由 Service 默认取今天起 30 天
     */
    @GetMapping("/listBookable")
    @Log("查询可约时段")
    public Result<List<TimeSlot>> listBookable(
            @RequestParam Long serviceItemId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate to) {
        return Result.success(timeSlotService.listBookable(serviceItemId, from, to));
    }

    /**
     * 机构端分页查自己的排班
     */
    @PostMapping("/mine/pageQuery")
    @Log("机构分页查询排班")
    @RequireProvider
    public Result<IPage<TimeSlot>> minePageQuery(@RequestBody @Valid SlotQuery query) {
        return Result.success(timeSlotService.pageQueryForProvider(query));
    }

    /**
     * 机构端批量生成排班。已存在的时段会跳过，可以反复点来补齐新日子
     */
    @PostMapping("/mine/generate")
    @Log("批量生成排班")
    @RequireProvider
    public Result<Integer> mineGenerate(@RequestBody @Valid SlotGenerateDTO dto) {
        int count = timeSlotService.generateMine(dto);
        return Result.success("已生成 " + count + " 个时段", count);
    }

    /**
     * 机构端开关单个时段
     */
    @PutMapping("/mine/changeStatus/{id}/{status}")
    @Log("开关排班时段")
    @RequireProvider
    public Result<Void> mineChangeStatus(@PathVariable Long id, @PathVariable Integer status) {
        timeSlotService.changeStatusMine(id, status);
        return Result.success(status != null && status == TimeSlot.STATUS_OPEN ? "已开放" : "已关闭");
    }

    /**
     * 机构端删除时段。已有人预约的删不掉
     */
    @DeleteMapping("/mine/deleteById/{id}")
    @Log("删除排班时段")
    @RequireProvider
    public Result<Void> mineDelete(@PathVariable Long id) {
        timeSlotService.removeMine(id);
        return Result.success("删除成功");
    }
}
