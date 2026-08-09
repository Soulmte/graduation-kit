package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.entity.Category;

import java.util.List;

/**
 * 商品分类服务接口
 */
public interface CategoryService extends IService<Category> {

    /**
     * 按 sort 升序列出全部分类
     */
    List<Category> listAllSorted();

    /**
     * 新增分类，同名直接拦掉
     */
    void add(Category category);

    /**
     * 更新分类，同名（排除自己）直接拦掉
     */
    void updateInfo(Category category);

    /**
     * 删除分类。分类下还挂着商品时不允许删，避免商品失去归属
     */
    void removeChecked(Long id);
}
