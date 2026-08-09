package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.CartAddDTO;
import com.example.dto.CartUpdateDTO;
import com.example.entity.CartItem;
import com.example.entity.Merchant;
import com.example.entity.Product;
import com.example.mapper.CartItemMapper;
import com.example.mapper.MerchantMapper;
import com.example.mapper.ProductMapper;
import com.example.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 购物车服务实现类
 *
 * 购物车不存价格：每次展示都实时读商品表。
 * 这样商家调价后购物车立刻跟着变，不会出现结算金额与显示金额不一致。
 */
@Service
public class CartServiceImpl extends ServiceImpl<CartItemMapper, CartItem> implements CartService {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private MerchantMapper merchantMapper;

    @Override
    public List<CartItem> listMine() {
        List<CartItem> list = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, UserContext.getUserId())
                .orderByDesc(CartItem::getUpdateTime));
        fillProduct(list);
        return list;
    }

    /**
     * 批量回填商品信息：名称、封面、现价、库存、状态、所属店铺
     */
    private void fillProduct(List<CartItem> list) {
        if (list == null || list.isEmpty()) {
            return;
        }

        List<Long> productIds = list.stream()
                .map(CartItem::getProductId).filter(Objects::nonNull).distinct().toList();
        if (productIds.isEmpty()) {
            return;
        }

        Map<Long, Product> productMap = productMapper.selectBatchIds(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<Long> merchantIds = productMap.values().stream()
                .map(Product::getMerchantId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> shopMap = merchantIds.isEmpty() ? Map.of()
                : merchantMapper.selectBatchIds(merchantIds).stream()
                        .collect(Collectors.toMap(Merchant::getId, Merchant::getShopName, (a, b) -> a));

        for (CartItem item : list) {
            Product p = productMap.get(item.getProductId());
            if (p == null) {
                // 商品已被商家删除，前端据 productStatus 为空提示"商品已失效"
                continue;
            }
            item.setProductName(p.getName());
            item.setProductCover(p.getCover());
            item.setPrice(p.getPrice());
            item.setStock(p.getStock());
            item.setProductStatus(p.getStatus());
            item.setMerchantId(p.getMerchantId());
            item.setShopName(shopMap.get(p.getMerchantId()));
        }
    }

    @Override
    public void addMine(CartAddDTO dto) {
        // 加车时就校验一次，避免把已下架商品放进购物车
        Product product = productMapper.selectById(dto.getProductId());
        if (product == null) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_EXIST);
        }
        if (product.getStatus() == null || product.getStatus() != Product.STATUS_ON) {
            throw new BusinessException(ResultCode.PRODUCT_OFF_SALE);
        }

        Long userId = UserContext.getUserId();
        CartItem exist = this.getOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getProductId, dto.getProductId()));

        if (exist == null) {
            CartItem item = new CartItem();
            item.setUserId(userId);
            item.setProductId(dto.getProductId());
            item.setQuantity(dto.getQuantity());
            this.save(item);
            return;
        }

        // 已在车里则叠加数量，上限与 DTO 校验保持一致
        int merged = Math.min(exist.getQuantity() + dto.getQuantity(), 999);
        CartItem update = new CartItem();
        update.setId(exist.getId());
        update.setQuantity(merged);
        this.updateById(update);
    }

    @Override
    public void updateMine(CartUpdateDTO dto) {
        requireMine(dto.getId());

        CartItem update = new CartItem();
        update.setId(dto.getId());
        update.setQuantity(dto.getQuantity());
        this.updateById(update);
    }

    @Override
    public void removeMine(Long id) {
        requireMine(id);
        this.removeById(id);
    }

    @Override
    public void removeMineBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 带 userId 条件删除，越权的 id 自然删不到
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, UserContext.getUserId())
                .in(CartItem::getId, ids));
    }

    @Override
    public void clearMine() {
        this.remove(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, UserContext.getUserId()));
    }

    @Override
    public List<CartItem> requireMineByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException(ResultCode.CART_EMPTY);
        }

        List<CartItem> list = this.list(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, UserContext.getUserId())
                .in(CartItem::getId, ids));

        // 查出来的条数对不上，说明有 id 不属于当前用户或已被删除
        if (list.size() != ids.stream().distinct().count()) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "购物车条目不存在或不属于你");
        }

        fillProduct(list);
        return list;
    }

    /**
     * 取条目并校验归属：不是自己车里的一律 403
     */
    private CartItem requireMine(Long id) {
        CartItem item = this.getById(id);
        if (item == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST);
        }
        if (!item.getUserId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN.getCode(), "不能操作他人的购物车");
        }
        return item;
    }
}
