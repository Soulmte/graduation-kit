package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.MerchantApplyDTO;
import com.example.dto.MerchantAuditDTO;
import com.example.dto.MerchantQuery;
import com.example.entity.Merchant;
import com.example.entity.User;
import com.example.mapper.MerchantMapper;
import com.example.mapper.UserMapper;
import com.example.service.MerchantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 商家服务实现类
 */
@Service
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements MerchantService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public IPage<Merchant> pageQuery(MerchantQuery query) {
        Page<Merchant> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Merchant> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getShopName())) {
            wrapper.like(Merchant::getShopName, query.getShopName());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Merchant::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "shopName" -> wrapper.orderBy(true, isAsc, Merchant::getShopName);
                case "status" -> wrapper.orderBy(true, isAsc, Merchant::getStatus);
                case "createTime" -> wrapper.orderBy(true, isAsc, Merchant::getCreateTime);
                default -> wrapper.orderByDesc(Merchant::getCreateTime);
            }
        } else {
            // 待审核的排前面，方便管理员优先处理
            wrapper.orderByAsc(Merchant::getStatus).orderByDesc(Merchant::getCreateTime);
        }

        IPage<Merchant> result = this.page(page, wrapper);
        fillUsername(result.getRecords());
        return result;
    }

    /**
     * 批量回填店主用户名，避免逐条查库
     */
    private void fillUsername(List<Merchant> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        List<Long> userIds = list.stream().map(Merchant::getUserId).distinct().toList();
        Map<Long, String> nameMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));
        list.forEach(m -> m.setUsername(nameMap.get(m.getUserId())));
    }

    @Override
    public void apply(MerchantApplyDTO dto) {
        Long userId = UserContext.getUserId();

        // 一个用户最多一个店，重复申请直接拦掉
        if (getByUserId(userId) != null) {
            throw new BusinessException(ResultCode.MERCHANT_EXIST);
        }

        Merchant merchant = new Merchant();
        merchant.setUserId(userId);
        merchant.setShopName(dto.getShopName());
        merchant.setLogo(dto.getLogo());
        merchant.setDescription(dto.getDescription());
        merchant.setContactPhone(dto.getContactPhone());
        // 状态一律从待审核开始，不接受前端指定
        merchant.setStatus(Merchant.STATUS_PENDING);
        this.save(merchant);
    }

    @Override
    public void updateMine(MerchantApplyDTO dto) {
        Merchant mine = getByUserId(UserContext.getUserId());
        if (mine == null) {
            throw new BusinessException(ResultCode.MERCHANT_NOT_EXIST);
        }

        // 只更新资料字段，status 与 userId 不允许通过本接口改动
        Merchant update = new Merchant();
        update.setId(mine.getId());
        update.setShopName(dto.getShopName());
        update.setLogo(dto.getLogo());
        update.setDescription(dto.getDescription());
        update.setContactPhone(dto.getContactPhone());
        this.updateById(update);
    }

    @Override
    public Merchant getMine() {
        Merchant mine = getByUserId(UserContext.getUserId());
        if (mine != null) {
            mine.setUsername(UserContext.getUsername());
        }
        return mine;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void audit(MerchantAuditDTO dto) {
        Merchant exist = this.getById(dto.getId());
        if (exist == null) {
            throw new BusinessException(ResultCode.MERCHANT_NOT_EXIST);
        }

        Merchant update = new Merchant();
        update.setId(exist.getId());
        update.setStatus(dto.getStatus());
        this.updateById(update);

        // 审核通过后把用户提为商家角色，封禁则退回普通用户
        User user = new User();
        user.setId(exist.getUserId());
        user.setRole(dto.getStatus() == Merchant.STATUS_NORMAL ? "merchant" : "user");
        userMapper.updateById(user);
    }

    @Override
    public Merchant requireMyMerchant() {
        // 管理员没有店铺，商家端接口对管理员也要求先有店，避免归属为空导致越界
        Merchant mine = getByUserId(UserContext.getUserId());
        if (mine == null) {
            throw new BusinessException(ResultCode.MERCHANT_NOT_EXIST);
        }
        if (mine.getStatus() == null || mine.getStatus() != Merchant.STATUS_NORMAL) {
            throw new BusinessException(ResultCode.MERCHANT_NOT_NORMAL);
        }
        return mine;
    }

    private Merchant getByUserId(Long userId) {
        if (userId == null) {
            return null;
        }
        return this.getOne(new LambdaQueryWrapper<Merchant>().eq(Merchant::getUserId, userId));
    }
}
