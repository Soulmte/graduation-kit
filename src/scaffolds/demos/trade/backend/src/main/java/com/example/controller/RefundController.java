package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireMerchant;
import com.example.common.result.Result;
import com.example.dto.RefundApplyDTO;
import com.example.dto.RefundAuditDTO;
import com.example.dto.RefundQuery;
import com.example.entity.Refund;
import com.example.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 退款控制器
 *
 *   /mine/*      买家：申请退款、查自己的退款单
 *   /merchant/*  商家：查自己店的退款单、审核
 *   /admin/*     管理员：查全部退款单
 *
 * 审核接口挂 @RequireMerchant，管理员也能通过（见注解说明），
 * 具体能不能处理这一单由 Service 再判一次归属。
 */
@RestController
@RequestMapping("/api/refund")
public class RefundController {

    @Autowired
    private RefundService refundService;

    // ---- 买家端 ----

    /**
     * 申请退款。金额取订单总额，不接受前端传入
     */
    @PostMapping("/mine/apply")
    @Log("申请退款")
    public Result<Void> apply(@RequestBody @Valid RefundApplyDTO dto) {
        refundService.applyMine(dto);
        return Result.success("退款申请已提交，请等待商家处理");
    }

    /**
     * 分页查询我的退款申请
     */
    @PostMapping("/mine/pageQuery")
    @Log("查询我的退款申请")
    public Result<IPage<Refund>> pageQueryMine(@RequestBody @Valid RefundQuery query) {
        return Result.success(refundService.pageQueryForBuyer(query));
    }

    // ---- 商家端 ----

    /**
     * 分页查询自己店的退款申请，待审核的排前面
     */
    @PostMapping("/merchant/pageQuery")
    @Log("商家查询退款申请")
    @RequireMerchant
    public Result<IPage<Refund>> pageQueryMerchant(@RequestBody @Valid RefundQuery query) {
        return Result.success(refundService.pageQueryForMerchant(query));
    }

    /**
     * 审核退款。同意则退款并回滚库存，拒绝则订单退回原状态
     */
    @PutMapping("/merchant/audit")
    @Log("审核退款")
    @RequireMerchant
    public Result<Void> audit(@RequestBody @Valid RefundAuditDTO dto) {
        refundService.auditByMerchant(dto);
        return Result.success("处理成功");
    }

    // ---- 管理端 ----

    /**
     * 分页查询全部退款申请
     */
    @PostMapping("/admin/pageQuery")
    @Log("管理员查询全部退款申请")
    @RequireAdmin
    public Result<IPage<Refund>> pageQueryAdmin(@RequestBody @Valid RefundQuery query) {
        return Result.success(refundService.pageQueryForAdmin(query));
    }
}
