package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商家查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class MerchantQuery extends PageQuery {
    /**
     * 店铺名称（模糊查询）
     */
    private String shopName;

    /**
     * 状态：0-待审核，1-正常，2-已封禁。为空则不限
     */
    private Integer status;
}
