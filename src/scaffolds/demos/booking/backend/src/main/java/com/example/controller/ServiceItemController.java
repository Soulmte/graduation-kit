package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireProvider;
import com.example.common.result.Result;
import com.example.dto.ServiceItemQuery;
import com.example.entity.ServiceItem;
import com.example.service.ServiceItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 服务项控制器
 *
 * 不带 /mine 的是买家视角（只看得到上线服务项），带 /mine 的是机构视角
 * （只看得到自己的）。权限边界靠路径区分，不靠参数，前端传什么都越不过去。
 */
@RestController
@RequestMapping("/api/serviceItem")
public class ServiceItemController {

    @Autowired
    private ServiceItemService serviceItemService;

    /**
     * 买家端分页查询上线服务项
     */
    @PostMapping("/pageQuery")
    @Log("分页查询服务项")
    public Result<IPage<ServiceItem>> pageQuery(@RequestBody @Valid ServiceItemQuery query) {
        return Result.success(serviceItemService.pageQueryForGuest(query));
    }

    /**
     * 买家端查看服务项详情
     */
    @GetMapping("/getById/{id}")
    @Log("查询服务项详情")
    public Result<ServiceItem> getById(@PathVariable Long id) {
        return Result.success(serviceItemService.getDetailForGuest(id));
    }

    /**
     * 机构端分页查询自己的服务项
     */
    @PostMapping("/mine/pageQuery")
    @Log("机构分页查询服务项")
    @RequireProvider
    public Result<IPage<ServiceItem>> minePageQuery(@RequestBody @Valid ServiceItemQuery query) {
        return Result.success(serviceItemService.pageQueryForProvider(query));
    }

    /**
     * 机构端新增服务项，默认下线，排好班再上线
     */
    @PostMapping("/mine/add")
    @Log("新增服务项")
    @RequireProvider
    public Result<Void> mineAdd(@RequestBody ServiceItem item) {
        serviceItemService.addMine(item);
        return Result.success("新增成功");
    }

    /**
     * 机构端更新自己的服务项
     */
    @PutMapping("/mine/update")
    @Log("更新服务项")
    @RequireProvider
    public Result<Void> mineUpdate(@RequestBody ServiceItem item) {
        serviceItemService.updateMine(item);
        return Result.success("更新成功");
    }

    /**
     * 机构端上下线服务项
     */
    @PutMapping("/mine/changeStatus/{id}/{status}")
    @Log("服务项上下线")
    @RequireProvider
    public Result<Void> mineChangeStatus(@PathVariable Long id, @PathVariable Integer status) {
        serviceItemService.changeStatusMine(id, status);
        return Result.success(status != null && status == ServiceItem.STATUS_ON ? "已上线" : "已下线");
    }

    /**
     * 机构端删除服务项
     */
    @DeleteMapping("/mine/deleteById/{id}")
    @Log("删除服务项")
    @RequireProvider
    public Result<Void> mineDelete(@PathVariable Long id) {
        serviceItemService.removeMine(id);
        return Result.success("删除成功");
    }
}
