package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.AppointmentCreateDTO;
import com.example.dto.AppointmentQuery;
import com.example.dto.AppointmentRejectDTO;
import com.example.entity.*;
import com.example.mapper.*;
import com.example.service.AppointmentService;
import com.example.service.ProviderService;
import com.example.service.ServiceItemService;
import com.example.service.TimeSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 预约单服务实现类
 *
 * 几个刻意的设计，答辩时容易被问到：
 *   1. 名额靠数据库条件更新抢，不在 Java 层先查后改，见 TimeSlotService#occupy。
 *   2. 同一用户同一时段只能约一次，避免刷名额，用未结束状态的单子做判重。
 *   3. 服务名、价格、日期时间都存快照，机构改价或删时段不影响旧单。
 *   4. 取消与拒单释放名额，失约不释放（人没来，位置也空着了，算机构损失）。
 *   5. 三端走不同的查询入口，各自强制覆盖归属条件，前端传什么都越不过边界。
 */
@Service
public class AppointmentServiceImpl extends ServiceImpl<AppointmentMapper, Appointment>
        implements AppointmentService {

    private static final DateTimeFormatter NO_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Autowired
    private ProviderMapper providerMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ReviewMapper reviewMapper;

    @Autowired
    private ServiceItemMapper serviceItemMapper;

    @Autowired
    private ProviderService providerService;

    @Autowired
    private ServiceItemService serviceItemService;

    @Autowired
    private TimeSlotService timeSlotService;

    // ------------------------------------------------------------------
    // 查询
    // ------------------------------------------------------------------

    @Override
    public IPage<Appointment> pageQueryForUser(AppointmentQuery query) {
        // 买家只能看自己的单，前端传的 userId 一律覆盖
        query.setUserId(UserContext.getUserId());
        query.setProviderId(null);
        return doPageQuery(query);
    }

    @Override
    public IPage<Appointment> pageQueryForProvider(AppointmentQuery query) {
        // 机构只能看自己机构的单
        query.setProviderId(providerService.requireMyProvider().getId());
        query.setUserId(null);
        return doPageQuery(query);
    }

    @Override
    public IPage<Appointment> pageQueryForAdmin(AppointmentQuery query) {
        return doPageQuery(query);
    }

    private IPage<Appointment> doPageQuery(AppointmentQuery query) {
        Page<Appointment> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Appointment> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getAppointmentNo())) {
            wrapper.like(Appointment::getAppointmentNo, query.getAppointmentNo());
        }
        if (query.getUserId() != null) {
            wrapper.eq(Appointment::getUserId, query.getUserId());
        }
        if (query.getProviderId() != null) {
            wrapper.eq(Appointment::getProviderId, query.getProviderId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Appointment::getStatus, query.getStatus());
        }
        if (query.getDateFrom() != null) {
            wrapper.ge(Appointment::getSlotDate, query.getDateFrom());
        }
        if (query.getDateTo() != null) {
            wrapper.le(Appointment::getSlotDate, query.getDateTo());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "appointmentNo" -> wrapper.orderBy(true, isAsc, Appointment::getAppointmentNo);
                case "slotDate" -> wrapper.orderBy(true, isAsc, Appointment::getSlotDate)
                        .orderByAsc(Appointment::getStartTime);
                case "status" -> wrapper.orderBy(true, isAsc, Appointment::getStatus);
                case "createTime" -> wrapper.orderBy(true, isAsc, Appointment::getCreateTime);
                default -> wrapper.orderByDesc(Appointment::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Appointment::getCreateTime);
        }

        IPage<Appointment> result = this.page(page, wrapper);
        fillNames(result.getRecords());
        return result;
    }

    /**
     * 批量回填预约人、机构名与是否已评价，避免列表页 N+1 查询
     */
    private void fillNames(List<Appointment> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> userIds = list.stream()
                .map(Appointment::getUserId).filter(Objects::nonNull).distinct().toList();
        if (!userIds.isEmpty()) {
            Map<Long, String> nameMap = userMapper.selectBatchIds(userIds).stream()
                    .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));
            list.forEach(a -> a.setUsername(nameMap.get(a.getUserId())));
        }

        List<Long> providerIds = list.stream()
                .map(Appointment::getProviderId).filter(Objects::nonNull).distinct().toList();
        if (!providerIds.isEmpty()) {
            Map<Long, String> providerMap = providerMapper.selectBatchIds(providerIds).stream()
                    .collect(Collectors.toMap(Provider::getId, Provider::getName, (a, b) -> a));
            list.forEach(a -> a.setProviderName(providerMap.get(a.getProviderId())));
        }

        // 一次查出这批单子里已评价的，买家端「去评价」按钮据此显示
        List<Long> ids = list.stream().map(Appointment::getId).filter(Objects::nonNull).toList();
        if (!ids.isEmpty()) {
            Set<Long> reviewed = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                            .in(Review::getAppointmentId, ids))
                    .stream().map(Review::getAppointmentId).collect(Collectors.toSet());
            list.forEach(a -> a.setReviewed(reviewed.contains(a.getId())));
        }
    }

    @Override
    public Appointment getDetail(Long id) {
        Appointment appointment = this.getById(id);
        if (appointment == null) {
            throw new BusinessException(ResultCode.APPOINTMENT_NOT_EXIST);
        }

        // 管理员看全部；否则要么是本人的单，要么是自己机构的单
        if (!UserContext.isAdmin()) {
            boolean isOwner = appointment.getUserId().equals(UserContext.getUserId());
            boolean isProviderSide = UserContext.isProvider()
                    && appointment.getProviderId().equals(providerService.requireMyProvider().getId());
            if (!isOwner && !isProviderSide) {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能查看他人的预约");
            }
        }

        fillNames(List.of(appointment));
        return appointment;
    }

    // ------------------------------------------------------------------
    // 创建
    // ------------------------------------------------------------------

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Appointment createMine(AppointmentCreateDTO dto) {
        Long userId = UserContext.getUserId();

        // 1. 时段与服务项都要可用。时段先查，拿到 serviceItemId 再查服务项
        TimeSlot slot = timeSlotService.requireBookable(dto.getTimeSlotId());
        ServiceItem item = serviceItemService.requireBookable(slot.getServiceItemId());

        // 2. 同一用户同一时段只能约一次。已取消、已拒绝的不算，允许重新约
        Long duplicate = this.count(new LambdaQueryWrapper<Appointment>()
                .eq(Appointment::getUserId, userId)
                .eq(Appointment::getTimeSlotId, slot.getId())
                .in(Appointment::getStatus,
                        Appointment.STATUS_PENDING,
                        Appointment.STATUS_CONFIRMED,
                        Appointment.STATUS_FINISHED));
        if (duplicate != null && duplicate > 0) {
            throw new BusinessException(ResultCode.APPOINTMENT_DUPLICATE);
        }

        // 3. 抢名额。条件里带 booked_count < capacity，靠行锁挡并发超约
        if (!timeSlotService.occupy(slot.getId())) {
            throw new BusinessException(ResultCode.SLOT_FULL);
        }

        // 4. 建单。价格与时间均按库里的现值写快照，前端传什么都不采纳
        Appointment appointment = new Appointment();
        appointment.setAppointmentNo(nextNo());
        appointment.setUserId(userId);
        appointment.setProviderId(slot.getProviderId());
        appointment.setServiceItemId(item.getId());
        appointment.setTimeSlotId(slot.getId());
        appointment.setServiceName(item.getName());
        appointment.setServiceCover(item.getCover());
        appointment.setPrice(item.getPrice());
        appointment.setSlotDate(slot.getSlotDate());
        appointment.setStartTime(slot.getStartTime());
        appointment.setEndTime(slot.getEndTime());
        appointment.setStatus(Appointment.STATUS_PENDING);
        appointment.setContactName(dto.getContactName());
        appointment.setContactPhone(dto.getContactPhone());
        appointment.setRemark(dto.getRemark());
        this.save(appointment);

        return appointment;
    }

    /**
     * 预约单号：AP + 时间戳 + 四位随机数。表上有唯一约束兜底
     */
    private String nextNo() {
        return "AP" + LocalDateTime.now().format(NO_FORMAT)
                + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
    }

    // ------------------------------------------------------------------
    // 买家侧状态流转
    // ------------------------------------------------------------------

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelMine(Long id) {
        Appointment appointment = requireMyAppointment(id);
        if (appointment.getStatus() == null
                || (appointment.getStatus() != Appointment.STATUS_PENDING
                && appointment.getStatus() != Appointment.STATUS_CONFIRMED)) {
            throw new BusinessException(ResultCode.APPOINTMENT_STATUS_ERROR.getCode(),
                    "只有待确认或已确认的预约可以取消");
        }
        // 服务已经开始就不让自助取消了，否则机构已经抽不出人手又白丢名额
        if (hasStarted(appointment)) {
            throw new BusinessException(ResultCode.APPOINTMENT_STATUS_ERROR.getCode(),
                    "服务时间已开始，无法自行取消，请联系机构");
        }

        // 取消要把占用的名额还回去
        timeSlotService.release(appointment.getTimeSlotId());

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setStatus(Appointment.STATUS_CANCELLED);
        update.setCancelTime(LocalDateTime.now());
        this.updateById(update);
    }

    @Override
    public void remindMine(Long id, String remark) {
        Appointment appointment = requireMyAppointment(id);
        requireStatus(appointment, Appointment.STATUS_PENDING, "只有待确认的预约需要催单");
        if (!StringUtils.hasText(remark)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "请填写催单内容");
        }
        if (remark.length() > 255) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "催单内容不能超过255字");
        }

        // 追加而不是覆盖，用户下单时写的特殊要求得留着
        String merged = StringUtils.hasText(appointment.getRemark())
                ? appointment.getRemark() + "｜催单：" + remark
                : "催单：" + remark;
        if (merged.length() > 255) {
            merged = merged.substring(0, 255);
        }

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setRemark(merged);
        this.updateById(update);
    }

    // ------------------------------------------------------------------
    // 机构端状态流转
    // ------------------------------------------------------------------

    @Override
    public void confirmByProvider(Long id) {
        Appointment appointment = requireProviderAppointment(id);
        requireStatus(appointment, Appointment.STATUS_PENDING, "只有待确认的预约可以接单");

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setStatus(Appointment.STATUS_CONFIRMED);
        update.setConfirmTime(LocalDateTime.now());
        this.updateById(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void rejectByProvider(AppointmentRejectDTO dto) {
        Appointment appointment = requireProviderAppointment(dto.getId());
        requireStatus(appointment, Appointment.STATUS_PENDING, "只有待确认的预约可以拒单");

        // 拒单释放名额，让其他人能约
        timeSlotService.release(appointment.getTimeSlotId());

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setStatus(Appointment.STATUS_REJECTED);
        update.setRejectReason(dto.getRejectReason());
        this.updateById(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishByProvider(Long id) {
        Appointment appointment = requireProviderAppointment(id);
        requireStatus(appointment, Appointment.STATUS_CONFIRMED, "只有已确认的预约可以核销");

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setStatus(Appointment.STATUS_FINISHED);
        update.setFinishTime(LocalDateTime.now());
        this.updateById(update);

        // 核销完成才算服务完成，累计服务项预约数
        serviceItemMapper.update(null, new LambdaUpdateWrapper<ServiceItem>()
                .setSql("booked = booked + 1")
                .eq(ServiceItem::getId, appointment.getServiceItemId()));
    }

    @Override
    public void noShowByProvider(Long id) {
        Appointment appointment = requireProviderAppointment(id);
        requireStatus(appointment, Appointment.STATUS_CONFIRMED, "只有已确认的预约可以标记失约");
        // 时间还没到不允许标记失约，否则可能是机构想赖掉正常预约
        if (!hasStarted(appointment)) {
            throw new BusinessException(ResultCode.APPOINTMENT_STATUS_ERROR.getCode(),
                    "服务时间尚未开始，不能标记失约");
        }

        Appointment update = new Appointment();
        update.setId(appointment.getId());
        update.setStatus(Appointment.STATUS_NO_SHOW);
        this.updateById(update);
    }

    // ------------------------------------------------------------------
    // 辅助
    // ------------------------------------------------------------------

    @Override
    public Appointment requireMyAppointment(Long id) {
        Appointment appointment = this.getById(id);
        if (appointment == null) {
            throw new BusinessException(ResultCode.APPOINTMENT_NOT_EXIST);
        }
        if (!appointment.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作他人的预约");
        }
        return appointment;
    }

    /**
     * 取预约单并校验是当前机构的单，不是一律 403
     */
    private Appointment requireProviderAppointment(Long id) {
        Provider mine = providerService.requireMyProvider();
        Appointment appointment = this.getById(id);
        if (appointment == null) {
            throw new BusinessException(ResultCode.APPOINTMENT_NOT_EXIST);
        }
        if (!mine.getId().equals(appointment.getProviderId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作其他机构的预约");
        }
        return appointment;
    }

    private void requireStatus(Appointment appointment, int expected, String message) {
        if (appointment.getStatus() == null || appointment.getStatus() != expected) {
            throw new BusinessException(ResultCode.APPOINTMENT_STATUS_ERROR.getCode(), message);
        }
    }

    /**
     * 判断服务时间是否已开始（以快照里的日期+开始时间为准）
     */
    private boolean hasStarted(Appointment appointment) {
        if (appointment.getSlotDate() == null || appointment.getStartTime() == null) {
            return false;
        }
        return LocalDateTime.of(appointment.getSlotDate(), appointment.getStartTime())
                .isBefore(LocalDateTime.now());
    }
}
