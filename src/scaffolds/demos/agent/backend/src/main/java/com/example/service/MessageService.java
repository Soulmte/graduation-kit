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
     * @param limit         最多取几条，注意是"条"不是"轮"
     * @param excludeId     要排除的消息 ID，传 null 表示不排除。
     *                      本次提问已经先落库了，不排掉它会跟末尾拼的提问重复一次
     */
    List<Message> listRecentHistory(Long conversationId, int limit, Long excludeId);
}
