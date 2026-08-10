package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ServiceItemQuery;
import com.example.entity.ServiceItem;

/**
 * 服务项服务接口
 */
public interface ServiceItemService extends IService<ServiceItem> {

    /**
     * 买家端分页查询，只出已上线的服务项
     */
    IPage<ServiceItem> pageQueryForGuest(ServiceItemQuery query);

    /**
     * 机构端分页查询自己的服务项，上下线都出
     */
    IPage<ServiceItem> pageQueryForProvider(ServiceItemQuery query);

    /**
     * 买家端查看详情，下线的服务项不可见
     */
    ServiceItem getDetailForGuest(Long id);

    /**
     * 机构端新增服务项，默认下线
     */
    void addMine(ServiceItem item);

    /**
     * 机构端更新自己的服务项
     */
    void updateMine(ServiceItem item);

    /**
     * 机构端上下线自己的服务项
     */
    void changeStatusMine(Long id, Integer status);

    /**
     * 机构端删除自己的服务项。已排班且有人预约时不允许删
     */
    void removeMine(Long id);

    /**
     * 取服务项并要求可预约（存在且已上线），预约下单时用
     */
    ServiceItem requireBookable(Long id);

    /**
     * 取服务项并校验归属，不是自己机构的一律 403
     */
    ServiceItem requireMineById(Long id);
}
