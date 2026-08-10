package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.dto.NoticeQuery;
import com.example.entity.Notice;
import com.example.mapper.NoticeMapper;
import com.example.service.NoticeService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 公告服务实现类
 */
@Service
public class NoticeServiceImpl extends ServiceImpl<NoticeMapper, Notice> implements NoticeService {
    
    @Override
    public IPage<Notice> pageQuery(NoticeQuery query) {
        Page<Notice> page = new Page<>(query.getPageNum(), query.getPageSize());
        
        LambdaQueryWrapper<Notice> wrapper = new LambdaQueryWrapper<>();
        
        // 标题模糊查询
        if (StringUtils.hasText(query.getTitle())) {
            wrapper.like(Notice::getTitle, query.getTitle());
        }
        
        // 内容模糊查询
        if (StringUtils.hasText(query.getContent())) {
            wrapper.like(Notice::getContent, query.getContent());
        }
        
        // 排序
        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "title" -> wrapper.orderBy(true, isAsc, Notice::getTitle);
                case "createTime" -> wrapper.orderBy(true, isAsc, Notice::getCreateTime);
                case "updateTime" -> wrapper.orderBy(true, isAsc, Notice::getUpdateTime);
                default -> wrapper.orderByDesc(Notice::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(Notice::getCreateTime);
        }
        
        return this.page(page, wrapper);
    }
}
