package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.NoticeQuery;
import com.example.entity.Notice;

/**
 * 公告服务接口
 */
public interface NoticeService extends IService<Notice> {
    /**
     * 分页查询公告列表（带条件）
     */
    IPage<Notice> pageQuery(NoticeQuery query);
}
