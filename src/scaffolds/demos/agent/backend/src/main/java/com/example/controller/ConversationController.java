package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.ConversationQuery;
import com.example.dto.ConversationRenameDTO;
import com.example.entity.Conversation;
import com.example.common.util.UserContext;
import com.example.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 会话控制器
 *
 * 越权防护是这个类的重点：所有前台接口都拿 UserContext 里的 userId，
 * 不接受前端传 userId。Service 层的 checkOwnership 再兜一道，
 * 别人的会话一律报"不存在"而不是"无权限"，不给探测留线索。
 */
@RestController
@RequestMapping("/api/conversation")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    // ==================== 前台 ====================

    /**
     * 我的会话列表，按最后消息时间倒序
     */
    @GetMapping("/listMine")
    public Result<List<Conversation>> listMine() {
        return Result.success(conversationService.listByUser(UserContext.getUserId()));
    }

    /**
     * 取会话详情连带全部消息。取别人的会话会报"不存在"。
     */
    @GetMapping("/getDetail/{id}")
    public Result<Conversation> getDetail(@PathVariable Long id) {
        return Result.success(conversationService.getDetailWithMessages(
                id, UserContext.getUserId(), false));
    }

    /**
     * 新建会话。有开场白的智能体会顺带落一条开场消息。
     */
    @PostMapping("/create/{agentId}")
    @Log("新建会话")
    public Result<Conversation> create(@PathVariable Long agentId) {
        return Result.success(conversationService.createConversation(agentId, UserContext.getUserId()));
    }

    /**
     * 重命名会话
     */
    @PutMapping("/rename/{id}")
    @Log("重命名会话")
    public Result<Void> rename(@PathVariable Long id, @RequestBody @Valid ConversationRenameDTO dto) {
        conversationService.rename(id, UserContext.getUserId(), dto.getTitle());
        return Result.success("已重命名");
    }

    /**
     * 删除会话及其下所有消息。
     *
     * 管理员删任意会话，普通用户只能删自己的——这里靠 isAdmin 放行。
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除会话")
    public Result<Void> deleteById(@PathVariable Long id) {
        conversationService.removeConversation(id, UserContext.getUserId(), UserContext.isAdmin());
        return Result.success("删除成功");
    }

    // ==================== 管理端 ====================

    /**
     * 分页查询所有人的会话，管理端用来看用量与排查问题
     */
    @PostMapping("/pageQuery")
    @Log("分页查询会话")
    @RequireAdmin
    public Result<IPage<Conversation>> pageQuery(@RequestBody @Valid ConversationQuery query) {
        return Result.success(conversationService.pageQuery(query));
    }

    /**
     * 管理端看任意会话的完整消息，用于排查"为什么答得不对"
     */
    @GetMapping("/getDetailForAdmin/{id}")
    @RequireAdmin
    public Result<Conversation> getDetailForAdmin(@PathVariable Long id) {
        return Result.success(conversationService.getDetailWithMessages(
                id, UserContext.getUserId(), true));
    }
}
