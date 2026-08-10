package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.AppointmentCreateDTO;
import com.example.dto.AppointmentQuery;
import com.example.dto.AppointmentRejectDTO;
import com.example.entity.Appointment;

/**
 * 预约单服务接口
 */
public interface AppointmentService extends IService<Appointment> {

    /**
     * 买家端分页查自己的预约
     */
    IPage<Appointment> pageQueryForUser(AppointmentQuery query);

    /**
     * 机构端分页查自己机构的预约
     */
    IPage<Appointment> pageQueryForProvider(AppointmentQuery query);

    /**
     * 管理端分页查全量预约
     */
    IPage<Appointment> pageQueryForAdmin(AppointmentQuery query);

    /**
     * 查预约详情。买家只能看自己的，机构只能看自己机构的，管理员不限
     */
    Appointment getDetail(Long id);

    /**
     * 买家创建预约。抢名额、写快照都在这里
     */
    Appointment createMine(AppointmentCreateDTO dto);

    /**
     * 买家取消预约。待确认与已确认都能取消，名额会释放
     */
    void cancelMine(Long id);

    /**
     * 买家催单：只是把备注补上，用于演示轻量交互
     */
    void remindMine(Long id, String remark);

    /**
     * 机构接单：待确认 → 已确认
     */
    void confirmByProvider(Long id);

    /**
     * 机构拒单：待确认 → 已拒绝，释放名额
     */
    void rejectByProvider(AppointmentRejectDTO dto);

    /**
     * 机构核销：已确认 → 已完成，累计服务项预约数
     */
    void finishByProvider(Long id);

    /**
     * 机构标记失约：已确认且时间已过 → 已失约，不释放名额
     */
    void noShowByProvider(Long id);

    /**
     * 取预约单并校验是当前买家自己的，评价时也用
     */
    Appointment requireMyAppointment(Long id);
}
