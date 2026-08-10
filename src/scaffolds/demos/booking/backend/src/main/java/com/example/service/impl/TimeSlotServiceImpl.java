package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.SlotGenerateDTO;
import com.example.dto.SlotQuery;
import com.example.entity.Provider;
import com.example.entity.ServiceItem;
import com.example.entity.TimeSlot;
import com.example.mapper.TimeSlotMapper;
import com.example.service.ProviderService;
import com.example.service.ServiceItemService;
import com.example.service.TimeSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 排班时段服务实现类
 *
 * 名额并发是这个 demo 最需要讲清的一点：
 *   抢名额用 UPDATE ... SET booked_count = booked_count + 1
 *            WHERE id = ? AND booked_count < capacity
 *   受影响行数为 0 就说明被别人抢先了，直接报名额已满。
 * 不在 Java 层先查后改，那样两个请求同时读到"还剩 1 个"就会超约。
 */
@Service
public class TimeSlotServiceImpl extends ServiceImpl<TimeSlotMapper, TimeSlot> implements TimeSlotService {

    /** 一次最多生成多少天，避免误填区间把库撑爆 */
    private static final int MAX_DAYS = 30;

    @Autowired
    private ProviderService providerService;

    @Autowired
    private ServiceItemService serviceItemService;

    @Override
    public List<TimeSlot> listBookable(Long serviceItemId, LocalDate from, LocalDate to) {
        if (serviceItemId == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "请指定服务项");
        }
        // 服务项本身下线了就不给约，不然会出现能约但下不了单的怪现象
        serviceItemService.requireBookable(serviceItemId);

        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(MAX_DAYS) : to;

        List<TimeSlot> list = this.list(new LambdaQueryWrapper<TimeSlot>()
                .eq(TimeSlot::getServiceItemId, serviceItemId)
                .eq(TimeSlot::getStatus, TimeSlot.STATUS_OPEN)
                .ge(TimeSlot::getSlotDate, start)
                .le(TimeSlot::getSlotDate, end)
                .orderByAsc(TimeSlot::getSlotDate)
                .orderByAsc(TimeSlot::getStartTime));

        // 已过期与已满额的直接不返回，前端拿到的就是能点的
        List<TimeSlot> bookable = list.stream()
                .filter(s -> !isExpired(s))
                .filter(s -> remainOf(s) > 0)
                .collect(Collectors.toList());
        fillView(bookable);
        return bookable;
    }

    @Override
    public IPage<TimeSlot> pageQueryForProvider(SlotQuery query) {
        Provider mine = providerService.requireMyProvider();
        // 机构端只能看自己的排班，前端传的 providerId 一律覆盖
        query.setProviderId(mine.getId());

        Page<TimeSlot> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<TimeSlot> wrapper = new LambdaQueryWrapper<TimeSlot>()
                .eq(TimeSlot::getProviderId, query.getProviderId());
        if (query.getServiceItemId() != null) {
            wrapper.eq(TimeSlot::getServiceItemId, query.getServiceItemId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(TimeSlot::getStatus, query.getStatus());
        }
        if (query.getDateFrom() != null) {
            wrapper.ge(TimeSlot::getSlotDate, query.getDateFrom());
        }
        if (query.getDateTo() != null) {
            wrapper.le(TimeSlot::getSlotDate, query.getDateTo());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "slotDate" -> wrapper.orderBy(true, isAsc, TimeSlot::getSlotDate)
                        .orderByAsc(TimeSlot::getStartTime);
                case "bookedCount" -> wrapper.orderBy(true, isAsc, TimeSlot::getBookedCount);
                default -> wrapper.orderByDesc(TimeSlot::getSlotDate);
            }
        } else {
            // 默认按时间正序，机构看排班习惯从早到晚
            wrapper.orderByAsc(TimeSlot::getSlotDate).orderByAsc(TimeSlot::getStartTime);
        }

        IPage<TimeSlot> result = this.page(page, wrapper);
        fillView(result.getRecords());
        fillServiceName(result.getRecords());
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int generateMine(SlotGenerateDTO dto) {
        // 归属校验：只能给自己机构的服务项排班
        ServiceItem item = serviceItemService.requireMineById(dto.getServiceItemId());

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "结束日期不能早于起始日期");
        }
        long days = dto.getStartDate().datesUntil(dto.getEndDate().plusDays(1)).count();
        if (days > MAX_DAYS) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                    "一次最多生成 " + MAX_DAYS + " 天，当前选了 " + days + " 天");
        }
        if (!dto.getOpenTime().isBefore(dto.getCloseTime())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "营业结束时间要晚于开始时间");
        }

        int duration = item.getDuration() == null ? 60 : item.getDuration();
        // 一天内至少要放得下一个完整时段，否则这次生成没有任何意义
        if (dto.getOpenTime().plusMinutes(duration).isAfter(dto.getCloseTime())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                    "营业时长不足一次服务（" + duration + " 分钟），请调整营业时间");
        }

        // 先把区间内已有的时段查出来，用「日期+开始时间」做键，重复的跳过
        Set<String> exists = this.list(new LambdaQueryWrapper<TimeSlot>()
                        .eq(TimeSlot::getServiceItemId, item.getId())
                        .ge(TimeSlot::getSlotDate, dto.getStartDate())
                        .le(TimeSlot::getSlotDate, dto.getEndDate()))
                .stream()
                .map(s -> s.getSlotDate() + "|" + s.getStartTime())
                .collect(Collectors.toSet());

        List<TimeSlot> batch = new ArrayList<>();
        for (LocalDate date : dto.getStartDate().datesUntil(dto.getEndDate().plusDays(1)).toList()) {
            LocalTime cursor = dto.getOpenTime();
            // 结束时间超出营业时间就停，不生成半截的时段
            while (!cursor.plusMinutes(duration).isAfter(dto.getCloseTime())) {
                LocalTime end = cursor.plusMinutes(duration);
                if (!exists.contains(date + "|" + cursor)) {
                    TimeSlot slot = new TimeSlot();
                    slot.setProviderId(item.getProviderId());
                    slot.setServiceItemId(item.getId());
                    slot.setSlotDate(date);
                    slot.setStartTime(cursor);
                    slot.setEndTime(end);
                    slot.setCapacity(dto.getCapacity());
                    slot.setBookedCount(0);
                    slot.setStatus(TimeSlot.STATUS_OPEN);
                    batch.add(slot);
                }
                cursor = end;
            }
        }

        if (batch.isEmpty()) {
            throw new BusinessException(ResultCode.ERROR.getCode(), "这个区间的时段都已经排过了");
        }
        this.saveBatch(batch);
        return batch.size();
    }

    @Override
    public void changeStatusMine(Long id, Integer status) {
        if (status == null || (status != TimeSlot.STATUS_OPEN && status != TimeSlot.STATUS_CLOSED)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "状态只能是0（关闭）或1（开放）");
        }
        requireMineById(id);

        TimeSlot update = new TimeSlot();
        update.setId(id);
        update.setStatus(status);
        this.updateById(update);
    }

    @Override
    public void removeMine(Long id) {
        TimeSlot slot = requireMineById(id);
        if (slot.getBookedCount() != null && slot.getBookedCount() > 0) {
            throw new BusinessException(ResultCode.ERROR.getCode(),
                    "该时段已有 " + slot.getBookedCount() + " 人预约，不能删除。可以先关闭");
        }
        this.removeById(id);
    }

    @Override
    public boolean occupy(Long slotId) {
        // 条件里带 booked_count < capacity，靠行锁挡并发超约
        return this.baseMapper.update(null, new LambdaUpdateWrapper<TimeSlot>()
                .setSql("booked_count = booked_count + 1")
                .eq(TimeSlot::getId, slotId)
                .eq(TimeSlot::getStatus, TimeSlot.STATUS_OPEN)
                .apply("booked_count < capacity")) > 0;
    }

    @Override
    public void release(Long slotId) {
        // 加 booked_count > 0 兜底，避免异常调用把名额减成负数
        this.baseMapper.update(null, new LambdaUpdateWrapper<TimeSlot>()
                .setSql("booked_count = booked_count - 1")
                .eq(TimeSlot::getId, slotId)
                .gt(TimeSlot::getBookedCount, 0));
    }

    @Override
    public TimeSlot requireBookable(Long id) {
        TimeSlot slot = this.getById(id);
        if (slot == null) {
            throw new BusinessException(ResultCode.SLOT_NOT_EXIST);
        }
        if (slot.getStatus() == null || slot.getStatus() != TimeSlot.STATUS_OPEN) {
            throw new BusinessException(ResultCode.SLOT_CLOSED);
        }
        if (isExpired(slot)) {
            throw new BusinessException(ResultCode.SLOT_EXPIRED);
        }
        if (remainOf(slot) <= 0) {
            throw new BusinessException(ResultCode.SLOT_FULL);
        }
        return slot;
    }

    /**
     * 取时段并校验归属，不是自己机构的一律 403
     */
    private TimeSlot requireMineById(Long id) {
        Provider mine = providerService.requireMyProvider();
        TimeSlot slot = this.getById(id);
        if (slot == null) {
            throw new BusinessException(ResultCode.SLOT_NOT_EXIST);
        }
        if (!mine.getId().equals(slot.getProviderId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作其他机构的排班");
        }
        return slot;
    }

    /**
     * 过期判断以「日期 + 开始时间」为准：开始了就不给约，不等到结束
     */
    private boolean isExpired(TimeSlot slot) {
        if (slot.getSlotDate() == null || slot.getStartTime() == null) {
            return false;
        }
        return LocalDateTime.of(slot.getSlotDate(), slot.getStartTime()).isBefore(LocalDateTime.now());
    }

    private int remainOf(TimeSlot slot) {
        int capacity = slot.getCapacity() == null ? 0 : slot.getCapacity();
        int booked = slot.getBookedCount() == null ? 0 : slot.getBookedCount();
        return capacity - booked;
    }

    /**
     * 回填剩余名额与过期标记，这两个值前端每处都要用，统一在后端算
     */
    private void fillView(List<TimeSlot> list) {
        if (list == null) {
            return;
        }
        for (TimeSlot slot : list) {
            slot.setRemain(remainOf(slot));
            slot.setExpired(isExpired(slot));
        }
    }

    /**
     * 批量回填服务名，机构端排班列表要显示"哪个服务的班"
     */
    private void fillServiceName(List<TimeSlot> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        List<Long> itemIds = list.stream()
                .map(TimeSlot::getServiceItemId).filter(Objects::nonNull).distinct().toList();
        if (itemIds.isEmpty()) {
            return;
        }
        Map<Long, String> nameMap = serviceItemService.listByIds(itemIds).stream()
                .collect(Collectors.toMap(ServiceItem::getId, ServiceItem::getName, (a, b) -> a));
        list.forEach(s -> s.setServiceName(nameMap.get(s.getServiceItemId())));
    }
}
