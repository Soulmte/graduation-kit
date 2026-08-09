package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.OrderCreateDTO;
import com.example.dto.OrderQuery;
import com.example.entity.Orders;

/**
 * 订单服务接口
 *
 * 状态流转集中在这一层，Controller 只负责转发。
 * 每个动作都先校验"当前状态是否允许"，不允许一律抛 ORDER_STATUS_ERROR。
 */
public interface OrderService extends IService<Orders> {

    /**
     * 买家端分页查询：强制限定为当前登录用户自己的订单
     */
    IPage<Orders> pageQueryForBuyer(OrderQuery query);

    /**
     * 商家端分页查询：强制限定为当前登录商家自己店的订单
     */
    IPage<Orders> pageQueryForMerchant(OrderQuery query);

    /**
     * 管理端分页查询：不加归属限制
     */
    IPage<Orders> pageQueryForAdmin(OrderQuery query);

    /**
     * 查订单详情（含明细）。买家看自己的，商家看自己店的，管理员都能看
     */
    Orders getDetail(Long id);

    /**
     * 创建订单：校验商品与库存 → 扣库存 → 写订单与明细 → 清购物车对应条目。
     * 跨店商品会被拒绝，提示用户分开下单。
     *
     * @return 新建的订单（含明细）
     */
    Orders createMine(OrderCreateDTO dto);

    /**
     * 买家支付：写支付流水，订单转待发货，商品累加销量。
     * 模拟支付，不接真实渠道。
     */
    void payMine(Long id);

    /**
     * 买家取消订单：仅待支付可取消，回滚库存
     */
    void cancelMine(Long id);

    /**
     * 买家确认收货：仅待收货可确认
     */
    void confirmMine(Long id);

    /**
     * 商家发货：仅待发货可发货
     */
    void shipByMerchant(Long id);
}
