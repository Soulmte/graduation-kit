package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.common.util.UserContext;
import com.example.dto.ProviderApplyDTO;
import com.example.dto.ProviderAuditDTO;
import com.example.dto.ProviderQuery;
import com.example.entity.Provider;
import com.example.entity.User;
import com.example.mapper.ProviderMapper;
import com.example.mapper.UserMapper;
import com.example.service.ProviderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 服务方（机构）服务实现类
 */
@Service
public class ProviderServiceImpl extends ServiceImpl<ProviderMapper, Provider> implements ProviderService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public IPage<Provider> pageQuery(ProviderQuery query) {
        Page<Provider> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Provider> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getName())) {
            wrapper.like(Provider::getName, query.getName());
        }
        if (query.getStatus() != null) {
            wrapper.eq(Provider::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "name" -> wrapper.orderBy(true, isAsc, Provider::getName);
                case "status" -> wrapper.orderBy(true, isAsc, Provider::getStatus);
                case "createTime" -> wrapper.orderBy(true, isAsc, Provider::getCreateTime);
                default -> wrapper.orderByDesc(Provider::getCreateTime);
            }
        } else {
            // 待审核的排前面，方便管理员优先处理
            wrapper.orderByAsc(Provider::getStatus).orderByDesc(Provider::getCreateTime);
        }

        IPage<Provider> result = this.page(page, wrapper);
        fillUsername(result.getRecords());
        return result;
    }

    /**
     * 批量回填负责人用户名，避免逐条查库
     */
    private void fillUsername(List<Provider> list) {
        if (list == null || list.isEmpty()) {
            return;
        }
        List<Long> userIds = list.stream().map(Provider::getUserId).distinct().toList();
        Map<Long, String> nameMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername, (a, b) -> a));
        list.forEach(p -> p.setUsername(nameMap.get(p.getUserId())));
    }

    @Override
    public void apply(ProviderApplyDTO dto) {
        Long userId = UserContext.getUserId();

        // 一个用户最多一家机构，重复申请直接拦掉
        if (getByUserId(userId) != null) {
            throw new BusinessException(ResultCode.PROVIDER_EXIST);
        }

        Provider provider = new Provider();
        provider.setUserId(userId);
        provider.setName(dto.getName());
        provider.setLogo(dto.getLogo());
        provider.setDescription(dto.getDescription());
        provider.setAddress(dto.getAddress());
        provider.setContactPhone(dto.getContactPhone());
        provider.setOpenTime(dto.getOpenTime());
        // 状态一律从待审核开始，不接受前端指定
        provider.setStatus(Provider.STATUS_PENDING);
        this.save(provider);
    }

    @Override
    public void updateMine(ProviderApplyDTO dto) {
        Provider mine = getByUserId(UserContext.getUserId());
        if (mine == null) {
            throw new BusinessException(ResultCode.PROVIDER_NOT_EXIST);
        }

        // 只更新资料字段，status 与 userId 不允许通过本接口改动
        Provider update = new Provider();
        update.setId(mine.getId());
        update.setName(dto.getName());
        update.setLogo(dto.getLogo());
        update.setDescription(dto.getDescription());
        update.setAddress(dto.getAddress());
        update.setContactPhone(dto.getContactPhone());
        update.setOpenTime(dto.getOpenTime());
        this.updateById(update);
    }

    @Override
    public Provider getMine() {
        Provider mine = getByUserId(UserContext.getUserId());
        if (mine != null) {
            mine.setUsername(UserContext.getUsername());
        }
        return mine;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void audit(ProviderAuditDTO dto) {
        Provider exist = this.getById(dto.getId());
        if (exist == null) {
            throw new BusinessException(ResultCode.PROVIDER_NOT_EXIST);
        }

        Provider update = new Provider();
        update.setId(exist.getId());
        update.setStatus(dto.getStatus());
        this.updateById(update);

        // 审核通过后把用户提为服务方角色，封禁则退回普通用户
        User user = new User();
        user.setId(exist.getUserId());
        user.setRole(dto.getStatus() == Provider.STATUS_NORMAL ? "provider" : "user");
        userMapper.updateById(user);
    }

    @Override
    public Provider requireMyProvider() {
        // 管理员没有机构，机构端接口对管理员也要求先有机构，避免归属为空导致越界
        Provider mine = getByUserId(UserContext.getUserId());
        if (mine == null) {
            throw new BusinessException(ResultCode.PROVIDER_NOT_EXIST);
        }
        if (mine.getStatus() == null || mine.getStatus() != Provider.STATUS_NORMAL) {
            throw new BusinessException(ResultCode.PROVIDER_NOT_NORMAL);
        }
        return mine;
    }

    private Provider getByUserId(Long userId) {
        if (userId == null) {
            return null;
        }
        return this.getOne(new LambdaQueryWrapper<Provider>().eq(Provider::getUserId, userId));
    }
}
