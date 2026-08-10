package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireProvider;
import com.example.common.result.Result;
import com.example.dto.ReviewCreateDTO;
import com.example.dto.ReviewQuery;
import com.example.dto.ReviewReplyDTO;
import com.example.entity.Review;
import com.example.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 服务评价控制器
 *
 * 评价列表是公开的（服务详情页要展示），发表限本人已完成的单，
 * 回复限收到评价的机构，删除只留给管理员处理违规内容。
 */
@RestController
@RequestMapping("/api/review")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * 分页查评价，服务详情页按 serviceItemId 查
     */
    @PostMapping("/pageQuery")
    @Log("分页查询评价")
    public Result<IPage<Review>> pageQuery(@RequestBody @Valid ReviewQuery query) {
        return Result.success(reviewService.pageQuery(query));
    }

    /**
     * 买家发表评价
     */
    @PostMapping("/mine/create")
    @Log("发表评价")
    public Result<Void> mineCreate(@RequestBody @Valid ReviewCreateDTO dto) {
        reviewService.createMine(dto);
        return Result.success("评价成功");
    }

    /**
     * 机构端分页查自己收到的评价
     */
    @PostMapping("/provider/pageQuery")
    @Log("机构查询评价列表")
    @RequireProvider
    public Result<IPage<Review>> providerPageQuery(@RequestBody @Valid ReviewQuery query) {
        return Result.success(reviewService.pageQueryForProvider(query));
    }

    /**
     * 机构回复评价
     */
    @PostMapping("/provider/reply")
    @Log("回复评价")
    @RequireProvider
    public Result<Void> providerReply(@RequestBody @Valid ReviewReplyDTO dto) {
        reviewService.replyByProvider(dto);
        return Result.success("回复成功");
    }

    /**
     * 管理员删除违规评价
     */
    @DeleteMapping("/admin/deleteById/{id}")
    @Log("删除评价")
    @RequireAdmin
    public Result<Void> adminDelete(@PathVariable Long id) {
        reviewService.removeByAdmin(id);
        return Result.success("删除成功");
    }
}
