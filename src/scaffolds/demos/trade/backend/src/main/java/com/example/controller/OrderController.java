package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireMerchant;
import com.example.common.result.Result;
import com.example.dto.OrderCreateDTO;
import com.example.dto.OrderQuery;
import com.example.dto.OrderShipDTO;
import com.example.entity.Orders;
import com.example.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 订单控制器
 *
 * 三端各走一条路径，权限一眼能看清：
 *   /mine/*      买家：下单、支付、取消、确认收货
 *   /merchant/*  商家：查自己店的单、发货
 *   /admin/*     管理员：查全部单
 *
 * 状态流转的判断都在 Service 层，这里只负责转发。
 */
@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // ---- 买家端 ----

    /**
     * 创建订单。支持购物车结算与商品页直接购买两种来源
     */
    @PostMapping("/mine/create")
    @Log("创建订单")
    public Result<Orders> create(@RequestBody @Valid OrderCreateDTO dto) {
        return Result.success("下单成功", orderService.createMine(dto));
    }

    /**
     * 分页查询我的订单
     */
    @PostMapping("/mine/pageQuery")
    @Log("查询我的订单")
    public Result<IPage<Orders>> pageQueryMine(@RequestBody @Valid OrderQuery query) {
        return Result.success(orderService.pageQueryForBuyer(query));
    }

    /**
     * 支付订单。模拟支付，直接记为成功
     */
    @PutMapping("/mine/pay/{id}")
    @Log("支付订单")
    public Result<Void> pay(@PathVariable Long id) {
        orderService.payMine(id);
        return Result.success("支付成功");
    }

    /**
     * 取消订单，仅待支付可取消，库存会还回去
     */
    @PutMapping("/mine/cancel/{id}")
    @Log("取消订单")
    public Result<Void> cancel(@PathVariable Long id) {
        orderService.cancelMine(id);
        return Result.success("已取消");
    }

    /**
     * 确认收货，仅待收货可确认
     */
    @PutMapping("/mine/confirm/{id}")
    @Log("确认收货")
    public Result<Void> confirm(@PathVariable Long id) {
        orderService.confirmMine(id);
        return Result.success("已确认收货");
    }

    // ---- 商家端 ----

    /**
     * 分页查询自己店的订单
     */
    @PostMapping("/merchant/pageQuery")
    @Log("商家查询店铺订单")
    @RequireMerchant
    public Result<IPage<Orders>> pageQueryMerchant(@RequestBody @Valid OrderQuery query) {
        return Result.success(orderService.pageQueryForMerchant(query));
    }

    /**
     * 发货，仅待发货可发货
     */
    @PutMapping("/merchant/ship")
    @Log("商家发货")
    @RequireMerchant
    public Result<Void> ship(@RequestBody @Valid OrderShipDTO dto) {
        orderService.shipByMerchant(dto.getId());
        return Result.success("已发货");
    }

    // ---- 管理端 ----

    /**
     * 分页查询全部订单
     */
    @PostMapping("/admin/pageQuery")
    @Log("管理员查询全部订单")
    @RequireAdmin
    public Result<IPage<Orders>> pageQueryAdmin(@RequestBody @Valid OrderQuery query) {
        return Result.success(orderService.pageQueryForAdmin(query));
    }

    // ---- 三端共用 ----

    /**
     * 订单详情。买家看自己的，商家看自己店的，管理员都能看
     */
    @GetMapping("/getById/{id}")
    @Log("查询订单详情")
    public Result<Orders> getById(@PathVariable Long id) {
        return Result.success(orderService.getDetail(id));
    }
}
