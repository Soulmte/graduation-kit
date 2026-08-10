package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ProviderApplyDTO;
import com.example.dto.ProviderAuditDTO;
import com.example.dto.ProviderQuery;
import com.example.entity.Provider;

/**
 * 服务方（机构）服务接口
 */
public interface ProviderService extends IService<Provider> {

    /**
     * 分页查询机构（管理端）
     */
    IPage<Provider> pageQuery(ProviderQuery query);

    /**
     * 当前登录用户申请入驻
     */
    void apply(ProviderApplyDTO dto);

    /**
     * 更新自己机构的资料，只能改自己的
     */
    void updateMine(ProviderApplyDTO dto);

    /**
     * 查询当前登录用户的机构，没有则返回 null
     */
    Provider getMine();

    /**
     * 审核或封禁机构（管理端）
     */
    void audit(ProviderAuditDTO dto);

    /**
     * 取当前登录用户的机构，并要求状态正常。
     * 机构端所有写操作都先过这一关，拿到的 id 即数据归属边界。
     */
    Provider requireMyProvider();
}
