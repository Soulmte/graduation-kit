package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireMerchant;
import com.example.common.result.Result;
import com.example.dto.ProductQuery;
import com.example.entity.Product;
import com.example.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 商品控制器
 *
 * 买家端与商家端走不同路径，而不是同一个接口靠参数区分：
 *   /pageQuery /getById            买家端，只出上架商品
 *   /mine/*                        商家端，只能碰自己店的商品
 * 路径分开后权限注解一目了然，也不怕漏判。
 */
@RestController
@RequestMapping("/api/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    // ---- 买家端 ----

    /**
     * 分页查询上架商品，支持按名称、分类、价格区间筛选
     */
    @PostMapping("/pageQuery")
    @Log("分页查询商品")
    public Result<IPage<Product>> pageQuery(@RequestBody @Valid ProductQuery query) {
        return Result.success(productService.pageQueryForBuyer(query));
    }

    /**
     * 查看商品详情，下架商品不可见
     */
    @GetMapping("/getById/{id}")
    @Log("查询商品详情")
    public Result<Product> getById(@PathVariable Long id) {
        return Result.success(productService.getDetailForBuyer(id));
    }

    // ---- 商家端 ----

    /**
     * 分页查询自己店的商品，上下架都出
     */
    @PostMapping("/mine/pageQuery")
    @Log("商家查询自己的商品")
    @RequireMerchant
    public Result<IPage<Product>> pageQueryMine(@RequestBody @Valid ProductQuery query) {
        return Result.success(productService.pageQueryForMerchant(query));
    }

    /**
     * 新增商品，默认下架，确认无误后再上架
     */
    @PostMapping("/mine/add")
    @Log("新增商品")
    @RequireMerchant
    public Result<Void> addMine(@RequestBody Product product) {
        productService.addMine(product);
        return Result.success("创建成功");
    }

    /**
     * 更新自己店的商品
     */
    @PutMapping("/mine/update")
    @Log("更新商品")
    @RequireMerchant
    public Result<Void> updateMine(@RequestBody Product product) {
        productService.updateMine(product);
        return Result.success("更新成功");
    }

    /**
     * 上下架自己店的商品
     */
    @PutMapping("/mine/changeStatus/{id}/{status}")
    @Log("商品上下架")
    @RequireMerchant
    public Result<Void> changeStatusMine(@PathVariable Long id, @PathVariable Integer status) {
        productService.changeStatusMine(id, status);
        return Result.success(status == Product.STATUS_ON ? "已上架" : "已下架");
    }

    /**
     * 删除自己店的商品
     */
    @DeleteMapping("/mine/deleteById/{id}")
    @Log("删除商品")
    @RequireMerchant
    public Result<Void> deleteMine(@PathVariable Long id) {
        productService.removeMine(id);
        return Result.success("删除成功");
    }
}
