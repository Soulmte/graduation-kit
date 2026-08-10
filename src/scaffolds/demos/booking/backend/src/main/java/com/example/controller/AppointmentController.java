package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireProvider;
import com.example.common.result.Result;
import com.example.dto.AppointmentCreateDTO;
import com.example.dto.AppointmentQuery;
import com.example.dto.AppointmentRejectDTO;
import com.example.entity.Appointment;
import com.example.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 预约单控制器
 *
 * 路径按角色隔离：/mine/* 买家自己的，/provider/* 机构端，/admin/* 管理端，
 * /getById/{id} 三方都能访问（Service 层自行校验权限）。
 */
@RestController
@RequestMapping("/api/appointment")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // ------------------------------------------------------------------
    // 买家端
    // ------------------------------------------------------------------

    /**
     * 买家分页查自己的预约
     */
    @PostMapping("/mine/pageQuery")
    @Log("查询我的预约")
    public Result<IPage<Appointment>> minePageQuery(@RequestBody @Valid AppointmentQuery query) {
        return Result.success(appointmentService.pageQueryForUser(query));
    }

    /**
     * 买家创建预约
     */
    @PostMapping("/mine/create")
    @Log("创建预约")
    public Result<Appointment> mineCreate(@RequestBody @Valid AppointmentCreateDTO dto) {
        return Result.success("预约成功", appointmentService.createMine(dto));
    }

    /**
     * 买家取消预约
     */
    @PutMapping("/mine/cancel/{id}")
    @Log("取消预约")
    public Result<Void> mineCancel(@PathVariable Long id) {
        appointmentService.cancelMine(id);
        return Result.success("已取消");
    }

    /**
     * 买家催单（写备注，轻量交互）
     */
    @PutMapping("/mine/remind/{id}")
    @Log("催单")
    public Result<Void> mineRemind(@PathVariable Long id, @RequestParam(required = false) String remark) {
        appointmentService.remindMine(id, remark);
        return Result.success("催单成功");
    }

    // ------------------------------------------------------------------
    // 通用
    // ------------------------------------------------------------------

    /**
     * 查预约详情。买家看自己的，机构看自己机构的，管理员不限
     */
    @GetMapping("/getById/{id}")
    @Log("查询预约详情")
    public Result<Appointment> getById(@PathVariable Long id) {
        return Result.success(appointmentService.getDetail(id));
    }

    // ------------------------------------------------------------------
    // 机构端
    // ------------------------------------------------------------------

    /**
     * 机构端分页查自己机构的预约
     */
    @PostMapping("/provider/pageQuery")
    @Log("机构查询预约列表")
    @RequireProvider
    public Result<IPage<Appointment>> providerPageQuery(@RequestBody @Valid AppointmentQuery query) {
        return Result.success(appointmentService.pageQueryForProvider(query));
    }

    /**
     * 机构接单：待确认 → 已确认
     */
    @PutMapping("/provider/confirm/{id}")
    @Log("接单")
    @RequireProvider
    public Result<Void> providerConfirm(@PathVariable Long id) {
        appointmentService.confirmByProvider(id);
        return Result.success("已接单");
    }

    /**
     * 机构拒单：待确认 → 已拒绝
     */
    @PostMapping("/provider/reject")
    @Log("拒单")
    @RequireProvider
    public Result<Void> providerReject(@RequestBody @Valid AppointmentRejectDTO dto) {
        appointmentService.rejectByProvider(dto);
        return Result.success("已拒单");
    }

    /**
     * 机构核销：已确认 → 已完成
     */
    @PutMapping("/provider/finish/{id}")
    @Log("核销预约")
    @RequireProvider
    public Result<Void> providerFinish(@PathVariable Long id) {
        appointmentService.finishByProvider(id);
        return Result.success("核销成功");
    }

    /**
     * 机构标记失约：已确认且时间已过 → 已失约
     */
    @PutMapping("/provider/noShow/{id}")
    @Log("标记失约")
    @RequireProvider
    public Result<Void> providerNoShow(@PathVariable Long id) {
        appointmentService.noShowByProvider(id);
        return Result.success("已标记失约");
    }

    // ------------------------------------------------------------------
    // 管理端
    // ------------------------------------------------------------------

    /**
     * 管理端分页查全量预约
     */
    @PostMapping("/admin/pageQuery")
    @Log("管理端查询预约列表")
    @RequireAdmin
    public Result<IPage<Appointment>> adminPageQuery(@RequestBody @Valid AppointmentQuery query) {
        return Result.success(appointmentService.pageQueryForAdmin(query));
    }
}
