package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ProductQuery;
import com.example.entity.Product;

/**
 * 商品服务接口
 */
public interface ProductService extends IService<Product> {

    /**
     * 买家端分页查询：只出已上架商品，且店铺状态正常
     */
    IPage<Product> pageQueryForBuyer(ProductQuery query);

    /**
     * 商家端分页查询：强制限定为当前登录商家自己的商品，上下架都出
     */
    IPage<Product> pageQueryForMerchant(ProductQuery query);

    /**
     * 买家端查看商品详情，下架商品不给看
     */
    Product getDetailForBuyer(Long id);

    /**
     * 商家新增自己的商品
     */
    void addMine(Product product);

    /**
     * 商家更新自己的商品，改别人的直接 403
     */
    void updateMine(Product product);

    /**
     * 商家上下架自己的商品
     */
    void changeStatusMine(Long id, Integer status);

    /**
     * 商家删除自己的商品
     */
    void removeMine(Long id);

    /**
     * 取商品并要求可购买（存在、已上架、库存足够），下单链路复用
     */
    Product requirePurchasable(Long id, int quantity);
}
