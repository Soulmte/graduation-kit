package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.MerchantApplyDTO;
import com.example.dto.MerchantAuditDTO;
import com.example.dto.MerchantQuery;
import com.example.entity.Merchant;
import com.example.service.MerchantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 商家控制器
 *
 * 分三类接口：
 *   /apply /mine /updateMine  任意登录用户，操作自己的店
 *   /pageQuery /audit         管理员，审核与封禁
 *   /getById                  公开给买家看店铺信息
 */
@RestController
@RequestMapping("/api/merchant")
public class MerchantController {

    @Autowired
    private MerchantService merchantService;

    /**
     * 申请开店
     */
    @PostMapping("/apply")
    @Log("申请开店")
    public Result<Void> apply(@RequestBody @Valid MerchantApplyDTO dto) {
        merchantService.apply(dto);
        return Result.success("申请已提交，请等待管理员审核");
    }

    /**
     * 查询自己的店铺，没申请过返回 data 为 null
     */
    @GetMapping("/mine")
    @Log("查询我的店铺")
    public Result<Merchant> mine() {
        return Result.success(merchantService.getMine());
    }

    /**
     * 修改自己店铺的资料
     */
    @PutMapping("/updateMine")
    @Log("修改店铺资料")
    public Result<Void> updateMine(@RequestBody @Valid MerchantApplyDTO dto) {
        merchantService.updateMine(dto);
        return Result.success("更新成功");
    }

    /**
     * 查看店铺信息，买家在商品详情页会用到
     */
    @GetMapping("/getById/{id}")
    @Log("查询店铺详情")
    public Result<Merchant> getById(@PathVariable Long id) {
        return Result.success(merchantService.getById(id));
    }

    /**
     * 分页查询店铺列表
     */
    @PostMapping("/pageQuery")
    @Log("分页查询店铺")
    @RequireAdmin
    public Result<IPage<Merchant>> pageQuery(@RequestBody @Valid MerchantQuery query) {
        return Result.success(merchantService.pageQuery(query));
    }

    /**
     * 审核或封禁店铺
     */
    @PutMapping("/audit")
    @Log("审核店铺")
    @RequireAdmin
    public Result<Void> audit(@RequestBody @Valid MerchantAuditDTO dto) {
        merchantService.audit(dto);
        return Result.success("处理成功");
    }
}
