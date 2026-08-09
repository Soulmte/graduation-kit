package com.example.controller;

import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.entity.Category;
import com.example.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商品分类控制器
 * 查询公开（买家筛选要用），增删改仅管理员
 */
@RestController
@RequestMapping("/api/category")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 列出全部分类，按 sort 升序
     */
    @GetMapping("/listAll")
    @Log("查询分类列表")
    public Result<List<Category>> listAll() {
        return Result.success(categoryService.listAllSorted());
    }

    /**
     * 新增分类
     */
    @PostMapping("/add")
    @Log("新增分类")
    @RequireAdmin
    public Result<Void> add(@RequestBody Category category) {
        categoryService.add(category);
        return Result.success("创建成功");
    }

    /**
     * 更新分类
     */
    @PutMapping("/update")
    @Log("更新分类")
    @RequireAdmin
    public Result<Void> update(@RequestBody Category category) {
        categoryService.updateInfo(category);
        return Result.success("更新成功");
    }

    /**
     * 删除分类，分类下有商品时会被拒绝
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除分类")
    @RequireAdmin
    public Result<Void> deleteById(@PathVariable Long id) {
        categoryService.removeChecked(id);
        return Result.success("删除成功");
    }
}
