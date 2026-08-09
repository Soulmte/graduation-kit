package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.RefundApplyDTO;
import com.example.dto.RefundAuditDTO;
import com.example.dto.RefundQuery;
import com.example.entity.*;
import com.example.mapper.*;
import com.example.service.MerchantService;
import com.example.service.RefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 退款服务实现类
 *
 * 被拒绝后订单要退回申请前的状态，但表里没存"申请前是什么状态"。
 * 这里按 shipTime 是否为空推断：没发货就回到待发货，发过货就回到待收货。
 * 这个推断成立的前提是只有这两个状态能申请退款，见 applyMine 的校验。
 */
@Service
public class RefundServiceImpl extends ServiceImpl<RefundMapper, Refund> implements RefundService {

    @Autowired
    private OrdersMapper ordersMapper;

    @Autowired
    private OrderItemMapper orderItemMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private MerchantService merchantService;

    // ------------------------------------------------------------------
    // 查询
    // ------------------------------------------------------------------

    @Override
    public IPage<Refund> pageQueryForBuyer(RefundQuery query) {
        // 买家只能看自己提的退款单
        query.setUserId(UserContext.getUserId());
        return doPageQuery(query, null);
    }

    @Override
    public IPage<Refund> pageQueryForMerchant(RefundQuery query) {
        Long merchantId = merchantService.requireMyMerchant().getId();

        // 先取自己店的订单ID，再按这批ID过滤退款单
        List<Long> orderIds = ordersMapper.selectList(new LambdaQueryWrapper<Orders>()
                        .select(Orders::getId)
                        .eq(Orders::getMerchantId, merchantId))
                .stream().map(Orders::getId).toList();

        query.setUserId(null);
        return doPageQuery(query, orderIds);
    }

    @Override
    public IPage<Refund> pageQueryForAdmin(RefundQuery query) {
        return doPageQuery(query, null);
    }

    /**
     * @param limitOrderIds 限定的订单ID范围，null 表示不限。传空集合表示一条都不该出
     */
    private IPage<Refund> doPageQuery(RefundQuery query, List<Long> limitOrderIds) {
        Page<Refund> page = new Page<>(query.getPageNum(), query.getPageSize());

        // 空集合直接返回空页，避免拼出 IN () 这种非法 SQL
        if (limitOrderIds != null && limitOrderIds.isEmpty()) {
            return page;
        }

        LambdaQueryWrapper<Refund> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getRefundNo())) {
            wrapper.like(Refund::getRefundNo, query.getRefundNo());
        }
        if (query.getUserId() != null) {
            wrapper.eq(Refund::getUserId, query.getUserId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Refund::getStatus, query.getStatus());
        }
        if (limitOrderIds != null) {
            wrapper.in(Refund::getOrderId, limitOrderIds);
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "refundNo" -> wrapper.orderBy(true, isAsc, Refund::getRefundNo);
                case "amount" -> wrapper.orderBy(true, isAsc, Refund::getAmount);
                case "status" -> wrapper.orderBy(true, isAsc, Refund::getStatus);
                case "createTime" -> wrapper.orderBy(true, isAsc, Refund::getCreateTime);
                default -> wrapper.orderByDesc(Refund::getCreateTime);
            }
        } else {
            // 待审核的排前面，方便商家优先处理
            wrapper.orderByAsc(Refund::getStatus).orderByDesc(Refund::getCreateTime);
        }

        IPage<Refund> result = this.page(page, wrapper);
        fillNames(result.getRecords());
        return result;
    }

    /**
     * 批量回填订单号与申请人用户名
     */
    private void fillNames(List<Refund> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> orderIds = list.stream().map(Refund::getOrderId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> orderMap = orderIds.isEmpty() ? Map.of()
                : ordersMapper.selectBatchIds(orderIds).stream()
                        .collect(Collectors.toMap(Orders::getId, Orders::getOrderNo, (a, b) -> a));

        List<Long> userIds = list.stream().map(Refund::getUserId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> userMap = userIds.isEmpty() ? Map.of()
                : userMapper.selectBatchIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));

        for (Refund refund : list) {
            refund.setOrderNo(orderMap.get(refund.getOrderId()));
            refund.setUsername(userMap.get(refund.getUserId()));
        }
    }

    // ------------------------------------------------------------------
    // 申请与审核
    // ------------------------------------------------------------------

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void applyMine(RefundApplyDTO dto) {
        Orders order = ordersMapper.selectById(dto.getOrderId());
        if (order == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_EXIST);
        }
        if (!order.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作他人的订单");
        }

        // 只有已付款、还没确认收货的订单能退。这也是拒绝后能推断回退状态的前提
        Integer status = order.getStatus();
        if (status == null
                || (status != Orders.STATUS_PAID && status != Orders.STATUS_SHIPPED)) {
            throw new BusinessException(ResultCode.ORDER_STATUS_ERROR.getCode(),
                    "只有已付款且未完成的订单可以申请退款");
        }

        // 同一单不允许有两条待审核的申请
        Long pending = this.count(new LambdaQueryWrapper<Refund>()
                .eq(Refund::getOrderId, order.getId())
                .eq(Refund::getStatus, Refund.STATUS_PENDING));
        if (pending != null && pending > 0) {
            throw new BusinessException(ResultCode.REFUND_PENDING_EXIST);
        }

        Refund refund = new Refund();
        refund.setRefundNo("RF" + order.getOrderNo());
        refund.setOrderId(order.getId());
        refund.setUserId(order.getUserId());
        // 金额取订单总额，不接受前端传入
        refund.setAmount(order.getTotalAmount());
        refund.setReason(dto.getReason());
        refund.setStatus(Refund.STATUS_PENDING);
        this.save(refund);

        // 订单转为退款中，此时商家不能再发货
        Orders update = new Orders();
        update.setId(order.getId());
        update.setStatus(Orders.STATUS_REFUNDING);
        ordersMapper.updateById(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void auditByMerchant(RefundAuditDTO dto) {
        Refund refund = this.getById(dto.getId());
        if (refund == null) {
            throw new BusinessException(ResultCode.REFUND_NOT_EXIST);
        }
        if (refund.getStatus() == null || refund.getStatus() != Refund.STATUS_PENDING) {
            throw new BusinessException(ResultCode.ERROR.getCode(), "该退款申请已处理过了");
        }

        Orders order = ordersMapper.selectById(refund.getOrderId());
        if (order == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_EXIST);
        }

        // 管理员可代为处理，商家只能处理自己店的单
        if (!UserContext.isAdmin()) {
            Long merchantId = merchantService.requireMyMerchant().getId();
            if (!merchantId.equals(order.getMerchantId())) {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能处理其他店铺的退款申请");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        Refund update = new Refund();
        update.setId(refund.getId());
        update.setStatus(dto.getStatus());
        update.setAuditBy(UserContext.getUsername());
        update.setAuditRemark(dto.getAuditRemark());
        update.setAuditTime(now);
        this.updateById(update);

        Orders orderUpdate = new Orders();
        orderUpdate.setId(order.getId());

        if (dto.getStatus() == Refund.STATUS_APPROVED) {
            // 同意：订单转已退款，卖出去的库存还回去
            orderUpdate.setStatus(Orders.STATUS_REFUNDED);
            restoreStock(order.getId());
        } else {
            // 拒绝：退回申请前的状态。发过货就是待收货，否则是待发货
            orderUpdate.setStatus(order.getShipTime() == null
                    ? Orders.STATUS_PAID
                    : Orders.STATUS_SHIPPED);
        }
        ordersMapper.updateById(orderUpdate);
    }

    /**
     * 按订单明细把库存加回去
     */
    private void restoreStock(Long orderId) {
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, orderId));
        for (OrderItem item : items) {
            productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("stock = stock + " + item.getQuantity())
                    .eq(Product::getId, item.getProductId()));
        }
    }
}
