package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.entity.ServiceCategory;
import com.example.entity.ServiceItem;
import com.example.mapper.ServiceCategoryMapper;
import com.example.mapper.ServiceItemMapper;
import com.example.service.ServiceCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 服务分类服务实现类
 */
@Service
public class ServiceCategoryServiceImpl extends ServiceImpl<ServiceCategoryMapper, ServiceCategory>
        implements ServiceCategoryService {

    @Autowired
    private ServiceItemMapper serviceItemMapper;

    @Override
    public List<ServiceCategory> listAllSorted() {
        return this.list(new LambdaQueryWrapper<ServiceCategory>()
                .orderByAsc(ServiceCategory::getSort)
                .orderByAsc(ServiceCategory::getId));
    }

    @Override
    public void add(ServiceCategory category) {
        if (!StringUtils.hasText(category.getName())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "分类名称不能为空");
        }
        if (existsName(category.getName(), null)) {
            throw new BusinessException(ResultCode.DATA_EXIST.getCode(), "该分类已存在");
        }
        if (category.getSort() == null) {
            category.setSort(0);
        }
        // id 由数据库生成，前端传了也不采纳
        category.setId(null);
        this.save(category);
    }

    @Override
    public void updateInfo(ServiceCategory category) {
        if (category.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "分类ID不能为空");
        }
        if (this.getById(category.getId()) == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST);
        }
        if (StringUtils.hasText(category.getName()) && existsName(category.getName(), category.getId())) {
            throw new BusinessException(ResultCode.DATA_EXIST.getCode(), "该分类已存在");
        }
        this.updateById(category);
    }

    @Override
    public void removeChecked(Long id) {
        if (this.getById(id) == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST);
        }
        Long used = serviceItemMapper.selectCount(new LambdaQueryWrapper<ServiceItem>()
                .eq(ServiceItem::getCategoryId, id));
        if (used != null && used > 0) {
            throw new BusinessException(ResultCode.ERROR.getCode(),
                    "该分类下还有 " + used + " 个服务项，请先调整服务项分类");
        }
        this.removeById(id);
    }

    /**
     * 判断分类名是否已被占用。excludeId 用于更新时排除自己
     */
    private boolean existsName(String name, Long excludeId) {
        LambdaQueryWrapper<ServiceCategory> wrapper = new LambdaQueryWrapper<ServiceCategory>()
                .eq(ServiceCategory::getName, name);
        if (excludeId != null) {
            wrapper.ne(ServiceCategory::getId, excludeId);
        }
        return this.count(wrapper) > 0;
    }
}
