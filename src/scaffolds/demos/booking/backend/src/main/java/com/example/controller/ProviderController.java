package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireProvider;
import com.example.common.result.Result;
import com.example.dto.ProviderApplyDTO;
import com.example.dto.ProviderAuditDTO;
import com.example.dto.ProviderQuery;
import com.example.entity.Provider;
import com.example.service.ProviderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 服务方（机构）控制器
 *
 * 三类入口分开放：/mine 是机构自己的，/audit 与 /pageQuery 是管理员的，
 * /apply 任何登录用户都能调（还没有机构的人才需要申请）。
 */
@RestController
@RequestMapping("/api/provider")
public class ProviderController {

    @Autowired
    private ProviderService providerService;

    /**
     * 分页查询机构（管理端）
     */
    @PostMapping("/pageQuery")
    @Log("分页查询机构")
    @RequireAdmin
    public Result<IPage<Provider>> pageQuery(@RequestBody @Valid ProviderQuery query) {
        return Result.success(providerService.pageQuery(query));
    }

    /**
     * 申请入驻。提交后状态为待审核，要等管理员放行
     */
    @PostMapping("/apply")
    @Log("申请入驻")
    public Result<Void> apply(@RequestBody @Valid ProviderApplyDTO dto) {
        providerService.apply(dto);
        return Result.success("申请已提交，请等待管理员审核");
    }

    /**
     * 查询自己的机构。没申请过返回 null，前端据此显示申请表单
     */
    @GetMapping("/mine")
    @Log("查询我的机构")
    public Result<Provider> mine() {
        return Result.success(providerService.getMine());
    }

    /**
     * 更新自己机构的资料
     */
    @PutMapping("/mine/update")
    @Log("更新我的机构")
    @RequireProvider
    public Result<Void> updateMine(@RequestBody @Valid ProviderApplyDTO dto) {
        providerService.updateMine(dto);
        return Result.success("更新成功");
    }

    /**
     * 审核或封禁机构（管理端）
     */
    @PostMapping("/audit")
    @Log("审核机构")
    @RequireAdmin
    public Result<Void> audit(@RequestBody @Valid ProviderAuditDTO dto) {
        providerService.audit(dto);
        return Result.success("操作成功");
    }
}
