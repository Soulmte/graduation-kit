package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.entity.ServiceCategory;

import java.util.List;

/**
 * 服务分类服务接口
 */
public interface ServiceCategoryService extends IService<ServiceCategory> {

    /**
     * 按 sort 升序列出全部分类
     */
    List<ServiceCategory> listAllSorted();

    /**
     * 新增分类，同名直接拦掉
     */
    void add(ServiceCategory category);

    /**
     * 更新分类，同名（排除自己）直接拦掉
     */
    void updateInfo(ServiceCategory category);

    /**
     * 删除分类。分类下还挂着服务项时不允许删，避免服务项失去归属
     */
    void removeChecked(Long id);
}
