package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ConversationQuery;
import com.example.entity.Agent;
import com.example.entity.Conversation;
import com.example.entity.Message;
import com.example.entity.User;
import com.example.mapper.ConversationMapper;
import com.example.mapper.UserMapper;
import com.example.service.AgentService;
import com.example.service.ConversationService;
import com.example.service.MessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 会话服务实现
 *
 * 归属校验统一走 checkOwnership：普通用户只能碰自己的会话，
 * 管理员在会话管理页需要看所有人的，所以用 isAdmin 放行。
 */
@Service
public class ConversationServiceImpl extends ServiceImpl<ConversationMapper, Conversation>
        implements ConversationService {

    /** 会话标题默认取提问前多少字 */
    private static final int TITLE_MAX_LEN = 20;

    private final AgentService agentService;
    private final MessageService messageService;
    private final UserMapper userMapper;

    public ConversationServiceImpl(AgentService agentService,
                                   MessageService messageService,
                                   UserMapper userMapper) {
        this.agentService = agentService;
        this.messageService = messageService;
        this.userMapper = userMapper;
    }

    @Override
    public IPage<Conversation> pageQuery(ConversationQuery query) {
        Page<Conversation> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<Conversation> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getTitle())) {
            wrapper.like(Conversation::getTitle, query.getTitle());
        }
        if (query.getAgentId() != null) {
            wrapper.eq(Conversation::getAgentId, query.getAgentId());
        }
        if (query.getUserId() != null) {
            wrapper.eq(Conversation::getUserId, query.getUserId());
        }
        wrapper.orderByDesc(Conversation::getLastTime).orderByDesc(Conversation::getId);

        IPage<Conversation> result = this.page(page, wrapper);
        fillExtra(result.getRecords());
        return result;
    }

    @Override
    public List<Conversation> listByUser(Long userId) {
        LambdaQueryWrapper<Conversation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Conversation::getUserId, userId)
                .orderByDesc(Conversation::getLastTime)
                .orderByDesc(Conversation::getId);

        List<Conversation> list = this.list(wrapper);
        fillExtra(list);
        return list;
    }

    @Override
    public Conversation getDetailWithMessages(Long id, Long userId, boolean isAdmin) {
        Conversation conversation = checkOwnership(id, userId, isAdmin);
        conversation.setMessages(messageService.listByConversation(id));
        fillExtra(Collections.singletonList(conversation));
        return conversation;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Conversation createConversation(Long agentId, Long userId) {
        // 前台建会话：草稿智能体直接当不存在
        Agent agent = agentService.getDetail(agentId, true);

        Conversation conversation = new Conversation();
        conversation.setUserId(userId);
        conversation.setAgentId(agentId);
        conversation.setTitle("新会话");
        conversation.setMsgCount(0);
        conversation.setLastTime(LocalDateTime.now());
        this.save(conversation);

        // 有开场白就落一条 assistant 消息，这样刷新页面开场白不会丢
        if (StringUtils.hasText(agent.getGreeting())) {
            Message greeting = new Message();
            greeting.setConversationId(conversation.getId());
            greeting.setRole(Message.ROLE_ASSISTANT);
            greeting.setContent(agent.getGreeting());
            messageService.save(greeting);
            touch(conversation.getId());
        }

        agentService.increaseChatCount(agentId);
        return this.getById(conversation.getId());
    }

    @Override
    public void rename(Long id, Long userId, String title) {
        checkOwnership(id, userId, false);

        LambdaUpdateWrapper<Conversation> update = new LambdaUpdateWrapper<>();
        update.eq(Conversation::getId, id).set(Conversation::getTitle, title);
        this.update(update);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeConversation(Long id, Long userId, boolean isAdmin) {
        checkOwnership(id, userId, isAdmin);

        // message 没有逻辑删除列，这里是真删
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getConversationId, id);
        messageService.remove(wrapper);

        this.removeById(id);
    }

    @Override
    public Conversation checkOwnership(Long id, Long userId, boolean isAdmin) {
        Conversation conversation = this.getById(id);
        if (conversation == null) {
            throw new BusinessException(ResultCode.CONVERSATION_NOT_EXIST);
        }
        // 不属于自己时报“不存在”而不是“无权限”，不给越权探测留线索
        if (!isAdmin && !Objects.equals(conversation.getUserId(), userId)) {
            throw new BusinessException(ResultCode.CONVERSATION_NOT_EXIST);
        }
        return conversation;
    }

    @Override
    public void touch(Long id) {
        // 消息数现算而不是自增：一次对话会写两条消息（问 + 答），
        // 现算不会因为中间失败重试而对不上。
        LambdaQueryWrapper<Message> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(Message::getConversationId, id);
        long count = messageService.count(countWrapper);

        LambdaUpdateWrapper<Conversation> update = new LambdaUpdateWrapper<>();
        update.eq(Conversation::getId, id)
                .set(Conversation::getMsgCount, count)
                .set(Conversation::getLastTime, LocalDateTime.now());
        this.update(update);
    }

    /**
     * 用首句提问当会话标题。只在标题还是默认值时换，
     * 用户手动改过名字就不再动。
     */
    @Override
    public void fillTitleIfBlank(Long id, String question) {
        Conversation conversation = this.getById(id);
        if (conversation == null || !StringUtils.hasText(question)) {
            return;
        }
        if (StringUtils.hasText(conversation.getTitle()) && !"新会话".equals(conversation.getTitle())) {
            return;
        }

        String title = question.strip().replaceAll("\\s+", " ");
        if (title.length() > TITLE_MAX_LEN) {
            title = title.substring(0, TITLE_MAX_LEN);
        }

        LambdaUpdateWrapper<Conversation> update = new LambdaUpdateWrapper<>();
        update.eq(Conversation::getId, id).set(Conversation::getTitle, title);
        this.update(update);
    }

    /**
     * 回填智能体信息与用户名，两次批量查询搞定
     */
    private void fillExtra(List<Conversation> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        Set<Long> agentIds = records.stream().map(Conversation::getAgentId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        if (!agentIds.isEmpty()) {
            LambdaQueryWrapper<Agent> wrapper = new LambdaQueryWrapper<>();
            wrapper.in(Agent::getId, agentIds).select(Agent::getId, Agent::getName, Agent::getAvatar);
            Map<Long, Agent> agentMap = agentService.list(wrapper).stream()
                    .collect(Collectors.toMap(Agent::getId, a -> a));
            records.forEach(c -> {
                Agent agent = agentMap.get(c.getAgentId());
                c.setAgentName(agent == null ? "已删除" : agent.getName());
                c.setAgentAvatar(agent == null ? null : agent.getAvatar());
            });
        }

        Set<Long> userIds = records.stream().map(Conversation::getUserId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        if (!userIds.isEmpty()) {
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            wrapper.in(User::getId, userIds).select(User::getId, User::getUsername);
            Map<Long, String> userMap = new HashMap<>();
            userMapper.selectList(wrapper).forEach(u -> userMap.put(u.getId(), u.getUsername()));
            records.forEach(c -> c.setUsername(userMap.get(c.getUserId())));
        }
    }
}
