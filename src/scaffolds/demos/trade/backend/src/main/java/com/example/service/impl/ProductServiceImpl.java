package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ProductQuery;
import com.example.entity.Category;
import com.example.entity.Merchant;
import com.example.entity.Product;
import com.example.mapper.CategoryMapper;
import com.example.mapper.MerchantMapper;
import com.example.mapper.ProductMapper;
import com.example.service.MerchantService;
import com.example.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 商品服务实现类
 *
 * 买家端与商家端共用一个查询方法体，区别在于进入前强制覆盖哪些条件：
 *   买家端 → status 固定为上架
 *   商家端 → merchantId 固定为自己的店
 * 这样前端传什么都越不过边界。
 */
@Service
public class ProductServiceImpl extends ServiceImpl<ProductMapper, Product> implements ProductService {

    @Autowired
    private MerchantService merchantService;

    @Autowired
    private MerchantMapper merchantMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public IPage<Product> pageQueryForBuyer(ProductQuery query) {
        // 买家端只能看上架商品，前端传的 status 一律覆盖
        query.setStatus(Product.STATUS_ON);
        IPage<Product> result = doPageQuery(query);
        fillNames(result.getRecords());
        return result;
    }

    @Override
    public IPage<Product> pageQueryForMerchant(ProductQuery query) {
        // 商家端只能看自己的商品，前端传的 merchantId 一律覆盖
        query.setMerchantId(merchantService.requireMyMerchant().getId());
        IPage<Product> result = doPageQuery(query);
        fillNames(result.getRecords());
        return result;
    }

    private IPage<Product> doPageQuery(ProductQuery query) {
        Page<Product> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getName())) {
            wrapper.like(Product::getName, query.getName());
        }
        if (query.getCategoryId() != null) {
            wrapper.eq(Product::getCategoryId, query.getCategoryId());
        }
        if (query.getMerchantId() != null) {
            wrapper.eq(Product::getMerchantId, query.getMerchantId());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Product::getStatus, query.getStatus());
        }
        if (query.getMinPrice() != null) {
            wrapper.ge(Product::getPrice, query.getMinPrice());
        }
        if (query.getMaxPrice() != null) {
            wrapper.le(Product::getPrice, query.getMaxPrice());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "name" -> wrapper.orderBy(true, isAsc, Product::getName);
                case "price" -> wrapper.orderBy(true, isAsc, Product::getPrice);
                case "stock" -> wrapper.orderBy(true, isAsc, Product::getStock);
                case "sales" -> wrapper.orderBy(true, isAsc, Product::getSales);
                case "createTime" -> wrapper.orderBy(true, isAsc, Product::getCreateTime);
                default -> wrapper.orderByDesc(Product::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Product::getCreateTime);
        }

        return this.page(page, wrapper);
    }

    /**
     * 批量回填分类名与店铺名，避免列表里逐条查库
     */
    private void fillNames(List<Product> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> categoryIds = list.stream()
                .map(Product::getCategoryId).filter(java.util.Objects::nonNull).distinct().toList();
        if (!categoryIds.isEmpty()) {
            Map<Long, String> categoryMap = categoryMapper.selectBatchIds(categoryIds).stream()
                    .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
            list.forEach(p -> p.setCategoryName(categoryMap.get(p.getCategoryId())));
        }

        List<Long> merchantIds = list.stream()
                .map(Product::getMerchantId).filter(java.util.Objects::nonNull).distinct().toList();
        if (!merchantIds.isEmpty()) {
            Map<Long, String> shopMap = merchantMapper.selectBatchIds(merchantIds).stream()
                    .collect(Collectors.toMap(Merchant::getId, Merchant::getShopName, (a, b) -> a));
            list.forEach(p -> p.setShopName(shopMap.get(p.getMerchantId())));
        }
    }

    @Override
    public Product getDetailForBuyer(Long id) {
        Product product = this.getById(id);
        if (product == null) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_EXIST);
        }
        if (product.getStatus() == null || product.getStatus() != Product.STATUS_ON) {
            throw new BusinessException(ResultCode.PRODUCT_OFF_SALE);
        }
        fillNames(List.of(product));
        return product;
    }

    @Override
    public void addMine(Product product) {
        Merchant mine = merchantService.requireMyMerchant();

        if (!StringUtils.hasText(product.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "商品名称不能为空");
        }
        if (product.getPrice() == null || product.getPrice().signum() < 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "商品价格不能为空且不能为负");
        }
        if (product.getStock() == null || product.getStock() < 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "库存不能为空且不能为负");
        }

        // 归属与销量由后端定，前端传了也不采纳
        product.setId(null);
        product.setMerchantId(mine.getId());
        product.setSales(0);
        if (product.getStatus() == null) {
            product.setStatus(Product.STATUS_OFF);
        }
        this.save(product);
    }

    @Override
    public void updateMine(Product product) {
        if (product.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "商品ID不能为空");
        }
        requireMineById(product.getId());

        if (product.getPrice() != null && product.getPrice().signum() < 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "商品价格不能为负");
        }
        if (product.getStock() != null && product.getStock() < 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "库存不能为负");
        }

        // 归属与销量不允许通过本接口改动
        product.setMerchantId(null);
        product.setSales(null);
        this.updateById(product);
    }

    @Override
    public void changeStatusMine(Long id, Integer status) {
        if (status == null || (status != Product.STATUS_ON && status != Product.STATUS_OFF)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "状态只能是0（下架）或1（上架）");
        }
        requireMineById(id);

        Product update = new Product();
        update.setId(id);
        update.setStatus(status);
        this.updateById(update);
    }

    @Override
    public void removeMine(Long id) {
        requireMineById(id);
        this.removeById(id);
    }

    @Override
    public Product requirePurchasable(Long id, int quantity) {
        Product product = this.getById(id);
        if (product == null) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_EXIST);
        }
        if (product.getStatus() == null || product.getStatus() != Product.STATUS_ON) {
            throw new BusinessException(ResultCode.PRODUCT_OFF_SALE);
        }
        if (product.getStock() == null || product.getStock() < quantity) {
            throw new BusinessException(ResultCode.STOCK_NOT_ENOUGH.getCode(),
                    "「" + product.getName() + "」库存不足，当前仅剩 "
                            + (product.getStock() == null ? 0 : product.getStock()) + " 件");
        }
        return product;
    }

    /**
     * 取商品并校验归属：不是自己店里的一律 403。
     * 商家端所有针对单个商品的写操作都先过这里。
     */
    private Product requireMineById(Long id) {
        Merchant mine = merchantService.requireMyMerchant();
        Product product = this.getById(id);
        if (product == null) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_EXIST);
        }
        if (!mine.getId().equals(product.getMerchantId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作其他店铺的商品");
        }
        return product;
    }
}
