package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ConversationQuery;
import com.example.entity.Conversation;

import java.util.List;

/**
 * 会话服务接口
 */
public interface ConversationService extends IService<Conversation> {

    /**
     * 分页查询（回填智能体名与用户名）
     */
    IPage<Conversation> pageQuery(ConversationQuery query);

    /**
     * 某个用户的会话列表，按最后消息时间倒序，给前台侧边栏用
     */
    List<Conversation> listByUser(Long userId);

    /**
     * 取会话详情连带全部消息。会校验归属，别人的会话取不到。
     */
    Conversation getDetailWithMessages(Long id, Long userId, boolean isAdmin);

    /**
     * 新建会话。如果智能体配了开场白，会顺带落一条 assistant 消息。
     */
    Conversation createConversation(Long agentId, Long userId);

    /**
     * 重命名
     */
    void rename(Long id, Long userId, String title);

    /**
     * 删除会话及其下所有消息
     */
    void removeConversation(Long id, Long userId, boolean isAdmin);

    /**
     * 校验会话归属，取不到或不属于该用户就抛错。管理员不受限。
     */
    Conversation checkOwnership(Long id, Long userId, boolean isAdmin);

    /**
     * 追加消息后刷新会话的计数与最后时间
     */
    void touch(Long id);

    /**
     * 拿首句提问当会话标题。已经改过名的会话不会被覆盖。
     */
    void fillTitleIfBlank(Long id, String question);
}
