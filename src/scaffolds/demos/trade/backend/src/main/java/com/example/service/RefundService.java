package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.RefundApplyDTO;
import com.example.dto.RefundAuditDTO;
import com.example.dto.RefundQuery;
import com.example.entity.Refund;

/**
 * 退款服务接口
 *
 * 退款是双方参与的流程，拆成申请与审核两步：
 *   买家 applyMine  → 订单转「退款中」，退款单待审核
 *   商家 auditByMerchant → 同意则订单转「已退款」并回滚库存，拒绝则订单退回原状态
 */
public interface RefundService extends IService<Refund> {

    /**
     * 买家端分页查询：强制限定为当前登录用户自己的退款单
     */
    IPage<Refund> pageQueryForBuyer(RefundQuery query);

    /**
     * 商家端分页查询：只出自己店订单产生的退款单
     */
    IPage<Refund> pageQueryForMerchant(RefundQuery query);

    /**
     * 管理端分页查询：不加归属限制
     */
    IPage<Refund> pageQueryForAdmin(RefundQuery query);

    /**
     * 买家申请退款。已支付未完成的订单才能申请，金额取订单总额
     */
    void applyMine(RefundApplyDTO dto);

    /**
     * 商家审核退款。同意则退款并回滚库存，拒绝则订单退回申请前的状态
     */
    void auditByMerchant(RefundAuditDTO dto);
}
