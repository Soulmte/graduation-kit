package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 评价查询条件
 * 服务详情页按 serviceItemId 查，机构端按自己的 providerId 查
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewQuery extends PageQuery {
    /**
     * 服务项ID
     */
    private Long serviceItemId;

    /**
     * 机构ID
     */
    private Long providerId;

    /**
     * 评价用户ID
     */
    private Long userId;

    /**
     * 评分下限（含），用于筛差评
     */
    private Integer minRating;

    /**
     * 评分上限（含）
     */
    private Integer maxRating;
}
