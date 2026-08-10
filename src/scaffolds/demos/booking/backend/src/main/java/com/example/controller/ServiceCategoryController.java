package com.example.controller;

import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.entity.ServiceCategory;
import com.example.service.ServiceCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 服务分类控制器
 *
 * 分类是全站公用的字典，读开放给所有人，写只给管理员。
 */
@RestController
@RequestMapping("/api/serviceCategory")
public class ServiceCategoryController {

    @Autowired
    private ServiceCategoryService serviceCategoryService;

    /**
     * 列出全部分类，按 sort 升序
     */
    @GetMapping("/list")
    @Log("查询服务分类")
    public Result<List<ServiceCategory>> list() {
        return Result.success(serviceCategoryService.listAllSorted());
    }

    /**
     * 新增分类
     */
    @PostMapping("/add")
    @Log("新增服务分类")
    @RequireAdmin
    public Result<Void> add(@RequestBody ServiceCategory category) {
        serviceCategoryService.add(category);
        return Result.success("新增成功");
    }

    /**
     * 更新分类
     */
    @PutMapping("/update")
    @Log("更新服务分类")
    @RequireAdmin
    public Result<Void> update(@RequestBody ServiceCategory category) {
        serviceCategoryService.updateInfo(category);
        return Result.success("更新成功");
    }

    /**
     * 删除分类。分类下还有服务项时会被拦掉
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除服务分类")
    @RequireAdmin
    public Result<Void> deleteById(@PathVariable Long id) {
        serviceCategoryService.removeChecked(id);
        return Result.success("删除成功");
    }
}
