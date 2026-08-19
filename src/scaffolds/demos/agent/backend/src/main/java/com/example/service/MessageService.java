package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.entity.Message;

import java.util.List;

/**
 * 消息服务接口
 */
public interface MessageService extends IService<Message> {

    /**
     * 取某个会话的全部消息，按 id 升序（即时间顺序）
     */
    List<Message> listByConversation(Long conversationId);

    /**
     * 取最近若干轮历史，喂给模型当上下文。
     * 返回的是时间正序，只含 user 与 assistant 且内容非空的消息。
     *
     * @param limit 最多取几条，注意是"条"不是"轮"
     */
    List<Message> listRecentHistory(Long conversationId, int limit);
}
