package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.MerchantApplyDTO;
import com.example.dto.MerchantAuditDTO;
import com.example.dto.MerchantQuery;
import com.example.entity.Merchant;

/**
 * 商家服务接口
 */
public interface MerchantService extends IService<Merchant> {

    /**
     * 分页查询店铺（管理端）
     */
    IPage<Merchant> pageQuery(MerchantQuery query);

    /**
     * 当前登录用户申请开店
     */
    void apply(MerchantApplyDTO dto);

    /**
     * 更新自己店铺的资料，只能改自己的
     */
    void updateMine(MerchantApplyDTO dto);

    /**
     * 查询当前登录用户的店铺，没有则返回 null
     */
    Merchant getMine();

    /**
     * 审核或封禁店铺（管理端）
     */
    void audit(MerchantAuditDTO dto);

    /**
     * 取当前登录用户的店铺，并要求状态正常。
     * 商家端所有写操作都先过这一关，拿到的 id 即数据归属边界。
     */
    Merchant requireMyMerchant();
}
