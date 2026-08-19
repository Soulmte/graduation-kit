package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Message;
import com.example.mapper.MessageMapper;
import com.example.service.MessageService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 消息服务实现
 */
@Service
public class MessageServiceImpl extends ServiceImpl<MessageMapper, Message> implements MessageService {

    @Override
    public List<Message> listByConversation(Long conversationId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getConversationId, conversationId).orderByAsc(Message::getId);
        return this.list(wrapper);
    }

    @Override
    public List<Message> listRecentHistory(Long conversationId, int limit) {
        if (limit <= 0) {
            return new ArrayList<>();
        }

        // 先按 id 倒序取最近 limit 条，再翻回正序。
        // 直接正序 + LIMIT 会取到最早的几条，那不是"最近"。
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getConversationId, conversationId)
                .in(Message::getRole, Message.ROLE_USER, Message.ROLE_ASSISTANT)
                .isNotNull(Message::getContent)
                .ne(Message::getContent, "")
                // 生成失败的消息不进上下文，否则模型会跟着学错
                .isNull(Message::getErrorMsg)
                .orderByDesc(Message::getId)
                .last("LIMIT " + limit);

        List<Message> recent = this.list(wrapper);
        List<Message> ordered = new ArrayList<>(recent);
        ordered.sort((a, b) -> Long.compare(a.getId(), b.getId()));
        return ordered;
    }
}
