package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ReviewCreateDTO;
import com.example.dto.ReviewQuery;
import com.example.dto.ReviewReplyDTO;
import com.example.entity.*;
import com.example.mapper.ReviewMapper;
import com.example.mapper.UserMapper;
import com.example.service.AppointmentService;
import com.example.service.ProviderService;
import com.example.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 服务评价服务实现类
 *
 * 评价的归属信息（机构、服务项）全部从预约单上反查，前端只需要传单号，
 * 这样既省参数又不可能评错对象。
 */
@Service
public class ReviewServiceImpl extends ServiceImpl<ReviewMapper, Review> implements ReviewService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProviderService providerService;

    @Autowired
    private AppointmentService appointmentService;

    @Override
    public IPage<Review> pageQuery(ReviewQuery query) {
        return doPageQuery(query);
    }

    @Override
    public IPage<Review> pageQueryForProvider(ReviewQuery query) {
        // 机构端只能看自己收到的评价，前端传的 providerId 一律覆盖
        query.setProviderId(providerService.requireMyProvider().getId());
        return doPageQuery(query);
    }

    private IPage<Review> doPageQuery(ReviewQuery query) {
        Page<Review> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Review> wrapper = new LambdaQueryWrapper<>();
        if (query.getServiceItemId() != null) {
            wrapper.eq(Review::getServiceItemId, query.getServiceItemId());
        }
        if (query.getProviderId() != null) {
            wrapper.eq(Review::getProviderId, query.getProviderId());
        }
        if (query.getUserId() != null) {
            wrapper.eq(Review::getUserId, query.getUserId());
        }
        if (query.getMinRating() != null) {
            wrapper.ge(Review::getRating, query.getMinRating());
        }
        if (query.getMaxRating() != null) {
            wrapper.le(Review::getRating, query.getMaxRating());
        }

        if (StringUtils.hasText(query.getOrderBy()) && "rating".equals(query.getOrderBy())) {
            wrapper.orderBy(true, "asc".equalsIgnoreCase(query.getOrder()), Review::getRating);
        } else {
            wrapper.orderByDesc(Review::getCreateTime);
        }

        IPage<Review> result = this.page(page, wrapper);
        fillNames(result.getRecords());
        return result;
    }

    /**
     * 批量回填评价人昵称与头像，列表页不逐条查库
     */
    private void fillNames(List<Review> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        List<Long> userIds = list.stream()
                .map(Review::getUserId).filter(Objects::nonNull).distinct().toList();
        if (userIds.isEmpty()) {
            return;
        }
        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        for (Review review : list) {
            User user = userMap.get(review.getUserId());
            if (user != null) {
                // 有昵称显示昵称，没填过就退回登录名
                review.setUsername(StringUtils.hasText(user.getNickname())
                        ? user.getNickname() : user.getUsername());
                review.setAvatar(user.getAvatar());
            }
        }
    }

    @Override
    public void createMine(ReviewCreateDTO dto) {
        // 单子必须是自己的，这一步顺带挡住了帮别人评价
        Appointment appointment = appointmentService.requireMyAppointment(dto.getAppointmentId());

        if (appointment.getStatus() == null || appointment.getStatus() != Appointment.STATUS_FINISHED) {
            throw new BusinessException(ResultCode.APPOINTMENT_STATUS_ERROR.getCode(),
                    "只有已完成的预约可以评价");
        }

        // 一单一评：唯一约束在库里也有，这里先给出友好提示
        Long exists = this.baseMapper.selectCount(new LambdaQueryWrapper<Review>()
                .eq(Review::getAppointmentId, appointment.getId()));
        if (exists != null && exists > 0) {
            throw new BusinessException(ResultCode.REVIEW_EXIST);
        }

        Review review = new Review();
        review.setAppointmentId(appointment.getId());
        review.setUserId(appointment.getUserId());
        // 机构与服务项从单子上抄，不接受前端传值
        review.setProviderId(appointment.getProviderId());
        review.setServiceItemId(appointment.getServiceItemId());
        review.setRating(dto.getRating());
        review.setContent(dto.getContent());
        this.save(review);
    }

    @Override
    public void replyByProvider(ReviewReplyDTO dto) {
        Review review = this.getById(dto.getId());
        if (review == null) {
            throw new BusinessException(ResultCode.REVIEW_NOT_EXIST);
        }

        Provider mine = providerService.requireMyProvider();
        if (!mine.getId().equals(review.getProviderId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能回复其他机构的评价");
        }

        Review update = new Review();
        update.setId(review.getId());
        update.setReply(dto.getReply());
        update.setReplyTime(LocalDateTime.now());
        this.updateById(update);
    }

    @Override
    public void removeByAdmin(Long id) {
        if (this.getById(id) == null) {
            throw new BusinessException(ResultCode.REVIEW_NOT_EXIST);
        }
        // 逻辑删除，评价撤掉后服务项均分会自动跟着变
        this.removeById(id);
    }
}
