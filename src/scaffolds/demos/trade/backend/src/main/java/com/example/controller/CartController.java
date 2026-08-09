package com.example.controller;

import com.example.common.annotation.Log;
import com.example.common.result.Result;
import com.example.dto.CartAddDTO;
import com.example.dto.CartUpdateDTO;
import com.example.entity.CartItem;
import com.example.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 购物车控制器
 *
 * 所有接口都以当前登录用户为边界，不接受 userId 参数。
 * 没有 pageQuery：购物车条目通常不多，一次全取更省事。
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    /**
     * 列出我的购物车，价格与库存实时取自商品表
     */
    @GetMapping("/listMine")
    @Log("查询购物车")
    public Result<List<CartItem>> listMine() {
        return Result.success(cartService.listMine());
    }

    /**
     * 加入购物车，已在车里则叠加数量
     */
    @PostMapping("/add")
    @Log("加入购物车")
    public Result<Void> add(@RequestBody @Valid CartAddDTO dto) {
        cartService.addMine(dto);
        return Result.success("已加入购物车");
    }

    /**
     * 修改购物车数量
     */
    @PutMapping("/update")
    @Log("修改购物车数量")
    public Result<Void> update(@RequestBody @Valid CartUpdateDTO dto) {
        cartService.updateMine(dto);
        return Result.success("更新成功");
    }

    /**
     * 移除一个条目
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("移除购物车商品")
    public Result<Void> deleteById(@PathVariable Long id) {
        cartService.removeMine(id);
        return Result.success("已移除");
    }

    /**
     * 批量移除
     */
    @DeleteMapping("/deleteBatch")
    @Log("批量移除购物车商品")
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        cartService.removeMineBatch(ids);
        return Result.success("已移除");
    }

    /**
     * 清空购物车
     */
    @DeleteMapping("/clear")
    @Log("清空购物车")
    public Result<Void> clear() {
        cartService.clearMine();
        return Result.success("已清空");
    }
}
