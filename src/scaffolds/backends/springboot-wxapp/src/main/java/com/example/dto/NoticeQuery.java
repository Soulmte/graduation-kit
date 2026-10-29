package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 公告查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class NoticeQuery extends PageQuery {
    /**
     * 标题（模糊查询）
     */
    private String title;
    
    /**
     * 内容（模糊查询）
     */
    private String content;
}
