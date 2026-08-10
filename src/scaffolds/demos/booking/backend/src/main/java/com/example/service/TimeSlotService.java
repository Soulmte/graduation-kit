package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.SlotGenerateDTO;
import com.example.dto.SlotQuery;
import com.example.entity.TimeSlot;

import java.time.LocalDate;
import java.util.List;

/**
 * 排班时段服务接口
 */
public interface TimeSlotService extends IService<TimeSlot> {

    /**
     * 买家端查某个服务项未来的可约时段。
     * 只返回开放中、未过期、还有名额的，前端不必再过滤
     */
    List<TimeSlot> listBookable(Long serviceItemId, LocalDate from, LocalDate to);

    /**
     * 机构端分页查自己的排班，关闭与过期的也出
     */
    IPage<TimeSlot> pageQueryForProvider(SlotQuery query);

    /**
     * 机构端按日期区间批量生成排班，返回实际新建的条数。
     * 已存在的时段跳过，方便反复点"生成"补齐新日子
     */
    int generateMine(SlotGenerateDTO dto);

    /**
     * 机构端开关单个时段
     */
    void changeStatusMine(Long id, Integer status);

    /**
     * 机构端删除时段。已有人预约的不允许删
     */
    void removeMine(Long id);

    /**
     * 抢占一个名额：条件更新 bookedCount < capacity，返回是否成功。
     * 预约创建时用，靠数据库行锁挡并发超约
     */
    boolean occupy(Long slotId);

    /**
     * 释放一个名额，用于取消与拒单
     */
    void release(Long slotId);

    /**
     * 取时段并要求可预约（存在、开放、未过期、有余额）
     */
    TimeSlot requireBookable(Long id);
}
