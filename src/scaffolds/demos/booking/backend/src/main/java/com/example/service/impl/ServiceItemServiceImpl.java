package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ServiceItemQuery;
import com.example.entity.*;
import com.example.mapper.*;
import com.example.service.ProviderService;
import com.example.service.ServiceItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 服务项服务实现类
 *
 * 买家端与机构端共用一个查询方法体，区别在于进入前强制覆盖哪些条件：
 *   买家端 → status 固定为上线
 *   机构端 → providerId 固定为自己的机构
 * 这样前端传什么都越不过边界。
 */
@Service
public class ServiceItemServiceImpl extends ServiceImpl<ServiceItemMapper, ServiceItem>
        implements ServiceItemService {

    @Autowired
    private ProviderService providerService;

    @Autowired
    private ProviderMapper providerMapper;

    @Autowired
    private ServiceCategoryMapper categoryMapper;

    @Autowired
    private ReviewMapper reviewMapper;

    @Autowired
    private TimeSlotMapper timeSlotMapper;

    @Override
    public IPage<ServiceItem> pageQueryForGuest(ServiceItemQuery query) {
        // 买家端只能看上线服务项，前端传的 status 一律覆盖
        query.setStatus(ServiceItem.STATUS_ON);
        IPage<ServiceItem> result = doPageQuery(query);
        fillExtra(result.getRecords());
        return result;
    }

    @Override
    public IPage<ServiceItem> pageQueryForProvider(ServiceItemQuery query) {
        // 机构端只能看自己的服务项，前端传的 providerId 一律覆盖
        query.setProviderId(providerService.requireMyProvider().getId());
        IPage<ServiceItem> result = doPageQuery(query);
        fillExtra(result.getRecords());
        return result;
    }

    private IPage<ServiceItem> doPageQuery(ServiceItemQuery query) {
        Page<ServiceItem> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<ServiceItem> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getName())) {
            wrapper.like(ServiceItem::getName, query.getName());
        }
        if (query.getCategoryId() != null) {
            wrapper.eq(ServiceItem::getCategoryId, query.getCategoryId());
        }
        if (query.getProviderId() != null) {
            wrapper.eq(ServiceItem::getProviderId, query.getProviderId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(ServiceItem::getStatus, query.getStatus());
        }
        if (query.getMinPrice() != null) {
            wrapper.ge(ServiceItem::getPrice, query.getMinPrice());
        }
        if (query.getMaxPrice() != null) {
            wrapper.le(ServiceItem::getPrice, query.getMaxPrice());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "name" -> wrapper.orderBy(true, isAsc, ServiceItem::getName);
                case "price" -> wrapper.orderBy(true, isAsc, ServiceItem::getPrice);
                case "duration" -> wrapper.orderBy(true, isAsc, ServiceItem::getDuration);
                case "booked" -> wrapper.orderBy(true, isAsc, ServiceItem::getBooked);
                case "createTime" -> wrapper.orderBy(true, isAsc, ServiceItem::getCreateTime);
                default -> wrapper.orderByDesc(ServiceItem::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(ServiceItem::getCreateTime);
        }

        return this.page(page, wrapper);
    }

    /**
     * 批量回填分类名、机构名与平均评分，避免列表里逐条查库
     */
    private void fillExtra(List<ServiceItem> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> categoryIds = list.stream()
                .map(ServiceItem::getCategoryId).filter(Objects::nonNull).distinct().toList();
        if (!categoryIds.isEmpty()) {
            Map<Long, String> categoryMap = categoryMapper.selectBatchIds(categoryIds).stream()
                    .collect(Collectors.toMap(ServiceCategory::getId, ServiceCategory::getName, (a, b) -> a));
            list.forEach(i -> i.setCategoryName(categoryMap.get(i.getCategoryId())));
        }

        List<Long> providerIds = list.stream()
                .map(ServiceItem::getProviderId).filter(Objects::nonNull).distinct().toList();
        if (!providerIds.isEmpty()) {
            Map<Long, String> providerMap = providerMapper.selectBatchIds(providerIds).stream()
                    .collect(Collectors.toMap(Provider::getId, Provider::getName, (a, b) -> a));
            list.forEach(i -> i.setProviderName(providerMap.get(i.getProviderId())));
        }

        fillAvgRating(list);
    }

    /**
     * 一次把这批服务项的评价全查出来，在内存里分组算均分。
     * 服务项数量有限（一页最多几十条），比每条发一次 AVG 查询划算。
     */
    private void fillAvgRating(List<ServiceItem> list) {
        List<Long> itemIds = list.stream().map(ServiceItem::getId).filter(Objects::nonNull).distinct().toList();
        if (itemIds.isEmpty()) {
            return;
        }
        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .in(Review::getServiceItemId, itemIds));
        if (reviews.isEmpty()) {
            return;
        }
        Map<Long, List<Review>> grouped = reviews.stream()
                .collect(Collectors.groupingBy(Review::getServiceItemId));
        for (ServiceItem item : list) {
            List<Review> mine = grouped.get(item.getId());
            if (mine == null || mine.isEmpty()) {
                continue;
            }
            int sum = mine.stream().mapToInt(r -> r.getRating() == null ? 0 : r.getRating()).sum();
            item.setAvgRating(BigDecimal.valueOf(sum)
                    .divide(BigDecimal.valueOf(mine.size()), 1, RoundingMode.HALF_UP));
        }
    }

    @Override
    public ServiceItem getDetailForGuest(Long id) {
        ServiceItem item = this.getById(id);
        if (item == null) {
            throw new BusinessException(ResultCode.SERVICE_NOT_EXIST);
        }
        if (item.getStatus() == null || item.getStatus() != ServiceItem.STATUS_ON) {
            throw new BusinessException(ResultCode.SERVICE_OFF_SALE);
        }
        fillExtra(List.of(item));
        return item;
    }

    @Override
    public void addMine(ServiceItem item) {
        Provider mine = providerService.requireMyProvider();

        validate(item, true);

        // 归属与统计数由后端定，前端传了也不采纳
        item.setId(null);
        item.setProviderId(mine.getId());
        item.setBooked(0);
        if (item.getStatus() == null) {
            item.setStatus(ServiceItem.STATUS_OFF);
        }
        this.save(item);
    }

    @Override
    public void updateMine(ServiceItem item) {
        if (item.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务项ID不能为空");
        }
        requireMineById(item.getId());

        validate(item, false);

        // 归属与统计数不允许通过本接口改动
        item.setProviderId(null);
        item.setBooked(null);
        this.updateById(item);
    }

    /**
     * 名称、价格、时长的公共校验。create 时必填，update 时只校验传了的字段
     */
    private void validate(ServiceItem item, boolean create) {
        if (create && !StringUtils.hasText(item.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务名称不能为空");
        }
        if (create && item.getPrice() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务价格不能为空");
        }
        if (item.getPrice() != null && item.getPrice().signum() < 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务价格不能为负");
        }
        if (create && item.getDuration() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务时长不能为空");
        }
        // 时长参与排班切片计算，为 0 会切出无限个时段，所以下限设为 1 分钟
        if (item.getDuration() != null && (item.getDuration() < 1 || item.getDuration() > 1440)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "服务时长需在 1 到 1440 分钟之间");
        }
    }

    @Override
    public void changeStatusMine(Long id, Integer status) {
        if (status == null || (status != ServiceItem.STATUS_ON && status != ServiceItem.STATUS_OFF)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "状态只能是0（下线）或1（上线）");
        }
        requireMineById(id);

        ServiceItem update = new ServiceItem();
        update.setId(id);
        update.setStatus(status);
        this.updateById(update);
    }

    @Override
    public void removeMine(Long id) {
        requireMineById(id);

        // 已有人占了名额的时段还挂在这个服务项上，删了会让预约单失去参照
        Long booked = timeSlotMapper.selectCount(new LambdaQueryWrapper<TimeSlot>()
                .eq(TimeSlot::getServiceItemId, id)
                .gt(TimeSlot::getBookedCount, 0));
        if (booked != null && booked > 0) {
            throw new BusinessException(ResultCode.ERROR.getCode(),
                    "该服务项已有 " + booked + " 个时段被预约，不能删除。可以先下线");
        }

        // 顺手清掉这个服务项下没人约的空时段，免得留下孤儿数据
        timeSlotMapper.delete(new LambdaQueryWrapper<TimeSlot>()
                .eq(TimeSlot::getServiceItemId, id));
        this.removeById(id);
    }

    @Override
    public ServiceItem requireBookable(Long id) {
        ServiceItem item = this.getById(id);
        if (item == null) {
            throw new BusinessException(ResultCode.SERVICE_NOT_EXIST);
        }
        if (item.getStatus() == null || item.getStatus() != ServiceItem.STATUS_ON) {
            throw new BusinessException(ResultCode.SERVICE_OFF_SALE);
        }
        return item;
    }

    @Override
    public ServiceItem requireMineById(Long id) {
        Provider mine = providerService.requireMyProvider();
        ServiceItem item = this.getById(id);
        if (item == null) {
            throw new BusinessException(ResultCode.SERVICE_NOT_EXIST);
        }
        if (!mine.getId().equals(item.getProviderId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作其他机构的服务项");
        }
        return item;
    }
}
