package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.CartAddDTO;
import com.example.dto.CartUpdateDTO;
import com.example.entity.CartItem;

import java.util.List;

/**
 * 购物车服务接口
 * 所有方法都以当前登录用户为边界，不接受前端传 userId
 */
public interface CartService extends IService<CartItem> {

    /**
     * 列出当前用户购物车，价格与库存实时取自商品表
     */
    List<CartItem> listMine();

    /**
     * 加入购物车。已存在则叠加数量
     */
    void addMine(CartAddDTO dto);

    /**
     * 修改数量，只能改自己车里的条目
     */
    void updateMine(CartUpdateDTO dto);

    /**
     * 移除一个条目
     */
    void removeMine(Long id);

    /**
     * 批量移除
     */
    void removeMineBatch(List<Long> ids);

    /**
     * 清空当前用户购物车
     */
    void clearMine();

    /**
     * 按条目ID取出当前用户的购物车条目，并回填商品信息。
     * 下单时复用：条目不属于自己或已失效都会抛异常。
     */
    List<CartItem> requireMineByIds(List<Long> ids);
}
