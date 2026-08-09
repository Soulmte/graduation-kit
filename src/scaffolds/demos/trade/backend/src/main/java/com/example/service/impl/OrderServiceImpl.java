package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.OrderCreateDTO;
import com.example.dto.OrderQuery;
import com.example.entity.*;
import com.example.mapper.*;
import com.example.service.CartService;
import com.example.service.MerchantService;
import com.example.service.OrderService;
import com.example.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 订单服务实现类
 *
 * 几个刻意的设计，答辩时容易被问到：
 *   1. 一单只属一个商家。购物车里跨店商品不自动拆单，而是提示用户分开下单，
 *      这样退款与发货的责任方始终唯一，逻辑简单得多。
 *   2. 扣库存用带条件的 UPDATE（stock >= n），靠数据库行锁挡住并发超卖，
 *      不在 Java 层判断后再扣。
 *   3. 金额一律后端按商品表现价计算，前端传的金额不采纳。
 *   4. 订单明细存商品名与单价快照，商品改价后旧订单不受影响。
 */
@Service
public class OrderServiceImpl extends ServiceImpl<OrdersMapper, Orders> implements OrderService {

    private static final DateTimeFormatter NO_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Autowired
    private OrderItemMapper orderItemMapper;

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private PaymentMapper paymentMapper;

    @Autowired
    private MerchantMapper merchantMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductService productService;

    @Autowired
    private MerchantService merchantService;

    // ------------------------------------------------------------------
    // 查询
    // ------------------------------------------------------------------

    @Override
    public IPage<Orders> pageQueryForBuyer(OrderQuery query) {
        // 买家只能看自己的单，前端传的 userId 一律覆盖
        query.setUserId(UserContext.getUserId());
        query.setMerchantId(null);
        return doPageQuery(query);
    }

    @Override
    public IPage<Orders> pageQueryForMerchant(OrderQuery query) {
        // 商家只能看自己店的单
        query.setMerchantId(merchantService.requireMyMerchant().getId());
        query.setUserId(null);
        return doPageQuery(query);
    }

    @Override
    public IPage<Orders> pageQueryForAdmin(OrderQuery query) {
        return doPageQuery(query);
    }

    private IPage<Orders> doPageQuery(OrderQuery query) {
        Page<Orders> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Orders> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getOrderNo())) {
            wrapper.like(Orders::getOrderNo, query.getOrderNo());
        }
        if (query.getUserId() != null) {
            wrapper.eq(Orders::getUserId, query.getUserId());
        }
        if (query.getMerchantId() != null) {
            wrapper.eq(Orders::getMerchantId, query.getMerchantId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Orders::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "orderNo" -> wrapper.orderBy(true, isAsc, Orders::getOrderNo);
                case "totalAmount" -> wrapper.orderBy(true, isAsc, Orders::getTotalAmount);
                case "status" -> wrapper.orderBy(true, isAsc, Orders::getStatus);
                case "createTime" -> wrapper.orderBy(true, isAsc, Orders::getCreateTime);
                default -> wrapper.orderByDesc(Orders::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Orders::getCreateTime);
        }

        IPage<Orders> result = this.page(page, wrapper);
        fillItemsAndNames(result.getRecords());
        return result;
    }

    /**
     * 批量回填明细、下单人与店铺名，避免列表页 N+1 查询
     */
    private void fillItemsAndNames(List<Orders> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> orderIds = list.stream().map(Orders::getId).toList();
        Map<Long, List<OrderItem>> itemMap = orderItemMapper.selectList(
                        new LambdaQueryWrapper<OrderItem>().in(OrderItem::getOrderId, orderIds))
                .stream().collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<Long> userIds = list.stream().map(Orders::getUserId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> userMap = userIds.isEmpty() ? Map.of()
                : userMapper.selectBatchIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));

        List<Long> merchantIds = list.stream().map(Orders::getMerchantId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> shopMap = merchantIds.isEmpty() ? Map.of()
                : merchantMapper.selectBatchIds(merchantIds).stream()
                        .collect(Collectors.toMap(Merchant::getId, Merchant::getShopName, (a, b) -> a));

        for (Orders order : list) {
            order.setItems(itemMap.getOrDefault(order.getId(), List.of()));
            order.setUsername(userMap.get(order.getUserId()));
            order.setShopName(shopMap.get(order.getMerchantId()));
        }
    }

    @Override
    public Orders getDetail(Long id) {
        Orders order = this.getById(id);
        if (order == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_EXIST);
        }

        // 管理员看全部；买家看自己的；商家看自己店的
        if (!UserContext.isAdmin()) {
            boolean isBuyer = order.getUserId().equals(UserContext.getUserId());
            boolean isSeller = false;
            if (!isBuyer && UserContext.isMerchant()) {
                Merchant mine = merchantService.getMine();
                isSeller = mine != null && mine.getId().equals(order.getMerchantId());
            }
            if (!isBuyer && !isSeller) {
                throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能查看他人的订单");
            }
        }

        fillItemsAndNames(List.of(order));
        return order;
    }

    // ------------------------------------------------------------------
    // 下单
    // ------------------------------------------------------------------

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Orders createMine(OrderCreateDTO dto) {
        Long userId = UserContext.getUserId();

        // 1. 归集本次要买的东西，两种来源统一成 productId → quantity
        LinkedHashMap<Long, Integer> wanted = new LinkedHashMap<>();
        List<Long> usedCartIds = new ArrayList<>();

        if (dto.fromCart()) {
            for (CartItem item : cartService.requireMineByIds(dto.getCartItemIds())) {
                wanted.merge(item.getProductId(), item.getQuantity(), Integer::sum);
                usedCartIds.add(item.getId());
            }
        } else {
            if (dto.getProductId() == null) {
                throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                        "请选择购物车条目或指定要购买的商品");
            }
            wanted.put(dto.getProductId(), dto.getQuantity() == null ? 1 : dto.getQuantity());
        }
        if (wanted.isEmpty()) {
            throw new BusinessException(ResultCode.CART_EMPTY);
        }

        // 2. 逐个校验可购买性，同时确认都是同一家店的
        List<Product> products = new ArrayList<>();
        Long merchantId = null;
        for (Map.Entry<Long, Integer> e : wanted.entrySet()) {
            Product product = productService.requirePurchasable(e.getKey(), e.getValue());
            if (merchantId == null) {
                merchantId = product.getMerchantId();
            } else if (!merchantId.equals(product.getMerchantId())) {
                throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                        "一个订单只能购买同一店铺的商品，请分开下单");
            }
            products.add(product);
        }

        // 3. 扣库存。条件里带 stock >= n，靠行锁挡并发超卖
        for (Product product : products) {
            int quantity = wanted.get(product.getId());
            boolean ok = deductStock(product.getId(), quantity);
            if (!ok) {
                throw new BusinessException(ResultCode.STOCK_NOT_ENOUGH.getCode(),
                        "「" + product.getName() + "」库存不足，请调整数量后重试");
            }
        }

        // 4. 建单。金额按商品表现价算，前端传什么都不采纳
        Orders order = new Orders();
        order.setOrderNo(nextOrderNo());
        order.setUserId(userId);
        order.setMerchantId(merchantId);
        order.setStatus(Orders.STATUS_UNPAID);
        order.setReceiverName(dto.getReceiverName());
        order.setReceiverPhone(dto.getReceiverPhone());
        order.setReceiverAddr(dto.getReceiverAddr());
        order.setRemark(dto.getRemark());

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (Product product : products) {
            int quantity = wanted.get(product.getId());
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(quantity));
            total = total.add(subtotal);

            OrderItem item = new OrderItem();
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setProductCover(product.getCover());
            item.setPrice(product.getPrice());
            item.setQuantity(quantity);
            item.setSubtotal(subtotal);
            items.add(item);
        }
        order.setTotalAmount(total);
        this.save(order);

        for (OrderItem item : items) {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
        }

        // 5. 购物车下单成功后清掉对应条目
        if (!usedCartIds.isEmpty()) {
            cartService.removeMineBatch(usedCartIds);
        }

        order.setItems(items);
        return order;
    }

    /**
     * 带条件扣库存：只有当前库存足够时才扣得动，返回是否成功
     */
    private boolean deductStock(Long productId, int quantity) {
        return productMapper.update(null, new LambdaUpdateWrapper<Product>()
                .setSql("stock = stock - " + quantity)
                .eq(Product::getId, productId)
                .ge(Product::getStock, quantity)) > 0;
    }

    /**
     * 回滚库存，用于取消订单与退款
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

    /**
     * 订单号：时间戳 + 四位随机数。表上有唯一约束兜底
     */
    private String nextOrderNo() {
        return LocalDateTime.now().format(NO_FORMAT)
                + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
    }

    // ------------------------------------------------------------------
    // 状态流转
    // ------------------------------------------------------------------

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void payMine(Long id) {
        Orders order = requireMyOrder(id);
        requireStatus(order, Orders.STATUS_UNPAID, "只有待支付的订单可以支付");

        LocalDateTime now = LocalDateTime.now();

        // 写支付流水。模拟支付，直接记成功
        Payment payment = new Payment();
        payment.setPayNo("PAY" + order.getOrderNo());
        payment.setOrderId(order.getId());
        payment.setUserId(order.getUserId());
        payment.setAmount(order.getTotalAmount());
        payment.setMethod("mock");
        payment.setStatus(Payment.STATUS_SUCCESS);
        payment.setPayTime(now);
        paymentMapper.insert(payment);

        Orders update = new Orders();
        update.setId(order.getId());
        update.setStatus(Orders.STATUS_PAID);
        update.setPayTime(now);
        this.updateById(update);

        // 支付成功才算销量
        for (OrderItem item : orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, order.getId()))) {
            productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("sales = sales + " + item.getQuantity())
                    .eq(Product::getId, item.getProductId()));
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelMine(Long id) {
        Orders order = requireMyOrder(id);
        requireStatus(order, Orders.STATUS_UNPAID, "只有待支付的订单可以取消");

        // 取消要把下单时扣掉的库存还回去
        restoreStock(order.getId());

        Orders update = new Orders();
        update.setId(order.getId());
        update.setStatus(Orders.STATUS_CANCELLED);
        update.setCancelTime(LocalDateTime.now());
        this.updateById(update);
    }

    @Override
    public void confirmMine(Long id) {
        Orders order = requireMyOrder(id);
        requireStatus(order, Orders.STATUS_SHIPPED, "只有待收货的订单可以确认收货");

        Orders update = new Orders();
        update.setId(order.getId());
        update.setStatus(Orders.STATUS_FINISHED);
        update.setFinishTime(LocalDateTime.now());
        this.updateById(update);
    }

    @Override
    public void shipByMerchant(Long id) {
        Merchant mine = merchantService.requireMyMerchant();
        Orders order = this.getById(id);
        if (order == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_EXIST);
        }
        if (!mine.getId().equals(order.getMerchantId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作其他店铺的订单");
        }
        requireStatus(order, Orders.STATUS_PAID, "只有待发货的订单可以发货");

        Orders update = new Orders();
        update.setId(order.getId());
        update.setStatus(Orders.STATUS_SHIPPED);
        update.setShipTime(LocalDateTime.now());
        this.updateById(update);
    }

    /**
     * 取订单并校验归属：不是自己下的单一律 403
     */
    private Orders requireMyOrder(Long id) {
        Orders order = this.getById(id);
        if (order == null) {
            throw new BusinessException(ResultCode.ORDER_NOT_EXIST);
        }
        if (!order.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作他人的订单");
        }
        return order;
    }

    /**
     * 校验当前状态是否为期望值，不是则带上具体原因抛出
     */
    private void requireStatus(Orders order, int expected, String message) {
        if (order.getStatus() == null || order.getStatus() != expected) {
            throw new BusinessException(ResultCode.ORDER_STATUS_ERROR.getCode(), message);
        }
    }
}
