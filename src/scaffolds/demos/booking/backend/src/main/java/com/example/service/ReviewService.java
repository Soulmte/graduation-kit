package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ReviewCreateDTO;
import com.example.dto.ReviewQuery;
import com.example.dto.ReviewReplyDTO;
import com.example.entity.Review;

/**
 * 服务评价服务接口
 */
public interface ReviewService extends IService<Review> {

    /**
     * 公开分页查评价，服务详情页与机构后台都走这个
     */
    IPage<Review> pageQuery(ReviewQuery query);

    /**
     * 机构端分页查自己机构收到的评价
     */
    IPage<Review> pageQueryForProvider(ReviewQuery query);

    /**
     * 买家发表评价：只有自己的、已完成且没评过的单子能评
     */
    void createMine(ReviewCreateDTO dto);

    /**
     * 机构回复评价
     */
    void replyByProvider(ReviewReplyDTO dto);

    /**
     * 管理员删除违规评价
     */
    void removeByAdmin(Long id);
}
