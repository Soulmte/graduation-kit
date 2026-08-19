package com.example.service.impl;

import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ChatDTO;
import com.example.dto.GraphDTO;
import com.example.entity.*;
import com.example.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * 智能体执行引擎实现
 *
 * 执行模型是单链：从 start 沿 edge 一路走到 end，没有条件分支也没有并行。
 * 这是刻意的取舍——分支与循环是最难写、最容易出 bug 的部分，
 * 而咨询类场景（检索 → 生成）一条链完全够用，答辩时也讲得清楚。
 *
 * 为什么要另起线程：SseEmitter 要求请求线程尽快返回，
 * 否则 Tomcat 的工作线程会被一次几十秒的模型调用占死。
 */
@Slf4j
@Service
public class AgentExecuteServiceImpl implements AgentExecuteService {

    /** SSE 超时，比模型超时留足余量 */
    private static final long SSE_TIMEOUT_MS = 300_000L;

    /** 默认取几条历史消息进上下文 */
    private static final int DEFAULT_HISTORY_LIMIT = 6;

    /** 单条知识条目拼进提示词时的截断长度，防止把 token 烧光 */
    private static final int KNOWLEDGE_MAX_LEN = 800;

    private final AgentService agentService;
    private final ModelConfigService modelConfigService;
    private final KnowledgeService knowledgeService;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;

    /**
     * 执行线程池。毕设的并发量很小，固定 4 个线程够用；
     * 用有界队列而不是无界，队列满了直接拒绝比堆到内存耗尽好。
     */
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public AgentExecuteServiceImpl(AgentService agentService,
                                   ModelConfigService modelConfigService,
                                   KnowledgeService knowledgeService,
                                   ConversationService conversationService,
                                   MessageService messageService,
                                   LlmClient llmClient,
                                   ObjectMapper objectMapper) {
        this.agentService = agentService;
        this.modelConfigService = modelConfigService;
        this.knowledgeService = knowledgeService;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.llmClient = llmClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public SseEmitter streamChat(ChatDTO dto, Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        // 验证与建会话放在请求线程里做：
        // 这些操作很快，而且它们靠 UserContext 取当前用户（数据存在 request 里），
        // 到了异步线程就取不到了。失败时直接抛，让全局异常处理器返回正常 JSON。
        Agent agent = agentService.getDetail(dto.getAgentId(), true);
        GraphDTO graph = agentService.parseGraph(agent.getGraphJson());

        Long conversationId;
        if (dto.getConversationId() == null) {
            conversationId = conversationService.createConversation(dto.getAgentId(), userId).getId();
        } else {
            Conversation conversation = conversationService.checkOwnership(dto.getConversationId(), userId, false);
            if (!Objects.equals(conversation.getAgentId(), dto.getAgentId())) {
                throw new BusinessException("会话与智能体对不上，刷新页面重试");
            }
            conversationId = conversation.getId();
        }

        // 先把用户的提问落库：即使后面模型挂了，问题也还在，用户能重试
        Message question = new Message();
        question.setConversationId(conversationId);
        question.setRole(Message.ROLE_USER);
        question.setContent(dto.getQuestion());
        messageService.save(question);
        conversationService.fillTitleIfBlank(conversationId, dto.getQuestion());
        conversationService.touch(conversationId);

        final Long convId = conversationId;
        final Long questionId = question.getId();
        executor.execute(() -> run(emitter, agent, graph, convId, dto.getQuestion(), questionId));
        return emitter;
    }

    /**
     * 在异步线程里把画布跑完。
     *
     * 不管成功失败，都会落一条 assistant 消息：
     * 成功的带 nodeTrace 与 token 用量，失败的带 errorMsg。
     * 这样刷新页面能看到当时发生了什么，不会只剩一个孤零零的提问。
     */
    private void run(SseEmitter emitter, Agent agent, GraphDTO graph,
                     Long conversationId, String question, Long questionId) {
        long startAt = System.currentTimeMillis();
        List<Map<String, Object>> traces = new ArrayList<>();

        // 节点之间传递的上下文：knowledge 往里写参考资料，llm 从里面读
        Map<String, Object> context = new HashMap<>();
        context.put("question", question);

        Message answer = new Message();
        answer.setConversationId(conversationId);
        answer.setRole(Message.ROLE_ASSISTANT);

        try {
            send(emitter, "meta", Map.of("conversationId", conversationId));

            Map<String, GraphDTO.Node> nodeMap = new LinkedHashMap<>();
            graph.getNodes().forEach(n -> nodeMap.put(n.getId(), n));

            Map<String, String> next = new HashMap<>();
            if (graph.getEdges() != null) {
                graph.getEdges().forEach(e -> next.put(e.getSource(), e.getTarget()));
            }

            String cursor = graph.getNodes().stream()
                    .filter(n -> GraphDTO.TYPE_START.equals(n.getType()))
                    .map(GraphDTO.Node::getId)
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "编排里没有开始节点"));

            StringBuilder reply = new StringBuilder();
            Integer tokenUsage = null;
            Set<String> walked = new HashSet<>();

            while (cursor != null) {
                // 保底：正常情况下发布前已经校过无环，这里再拦一道避免无限循环
                if (!walked.add(cursor)) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "编排出现循环，已中止");
                }

                GraphDTO.Node node = nodeMap.get(cursor);
                if (node == null) {
                    throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(), "连线指向了不存在的节点");
                }

                long nodeStart = System.currentTimeMillis();
                String output = switch (node.getType()) {
                    case GraphDTO.TYPE_START -> "收到提问：" + brief(question, 40);
                    case GraphDTO.TYPE_KNOWLEDGE -> runKnowledge(node, agent, question, context);
                    case GraphDTO.TYPE_LLM -> {
                        LlmClient.LlmResult result = runLlm(emitter, node, agent, conversationId,
                                questionId, context);
                        reply.append(result.getContent());
                        yield "已生成 " + result.getContent().length() + " 字";
                    }
                    case GraphDTO.TYPE_END -> "输出完成";
                    default -> throw new BusinessException(ResultCode.GRAPH_INVALID.getCode(),
                            "不认识的节点类型：" + node.getType());
                };

                // llm 节点的 token 用量存在 context 里带出来
                Object usage = context.get("tokenUsage");
                if (usage instanceof Integer u) {
                    tokenUsage = u;
                }

                Map<String, Object> trace = new LinkedHashMap<>();
                trace.put("nodeKey", node.getId());
                trace.put("nodeType", node.getType());
                trace.put("title", titleOf(node));
                trace.put("cost", System.currentTimeMillis() - nodeStart);
                trace.put("output", output);
                traces.add(trace);
                send(emitter, "trace", trace);

                if (GraphDTO.TYPE_END.equals(node.getType())) {
                    break;
                }
                cursor = next.get(cursor);
            }

            long cost = System.currentTimeMillis() - startAt;
            answer.setContent(reply.toString());
            answer.setNodeTrace(toJson(traces));
            answer.setTokenUsage(tokenUsage);
            answer.setCostMs(cost);
            messageService.save(answer);
            conversationService.touch(conversationId);

            send(emitter, "done", Map.of(
                    "messageId", answer.getId(),
                    "tokenUsage", tokenUsage == null ? 0 : tokenUsage,
                    "costMs", cost));
            emitter.complete();

        } catch (Exception e) {
            log.error("智能体执行失败，agentId={}, conversationId={}", agent.getId(), conversationId, e);
            String reason = e instanceof BusinessException be ? be.getMessage() : "执行失败：" + e.getMessage();

            // 失败也要落库，否则刷新后只剩提问看不出发生过什么
            try {
                answer.setContent(null);
                answer.setNodeTrace(toJson(traces));
                answer.setCostMs(System.currentTimeMillis() - startAt);
                answer.setErrorMsg(brief(reason, 500));
                messageService.save(answer);
                conversationService.touch(conversationId);
            } catch (Exception saveEx) {
                log.error("失败消息落库也出错了", saveEx);
            }

            try {
                send(emitter, "error", Map.of("message", reason));
                emitter.complete();
            } catch (Exception ignored) {
                // 客户端可能已经断开，这里再报错没意义
                emitter.completeWithError(e);
            }
        }
    }

    /**
     * 知识检索节点：召回 topK 条资料，拼成一段文本存进 context。
     *
     * 没命中也不报错，只是后面 llm 拿不到参考资料，
     * 提示词里会告诉模型“没查到资料，不确定就直说”。
     */
    private String runKnowledge(GraphDTO.Node node, Agent agent, String question,
                               Map<String, Object> context) {
        int topK = intOf(node.getData().get("topK"), 3);
        List<Knowledge> hits = knowledgeService.retrieve(agent.getId(), question, topK);

        if (hits.isEmpty()) {
            context.remove("knowledge");
            return "没有命中知识条目";
        }

        StringBuilder material = new StringBuilder();
        for (int i = 0; i < hits.size(); i++) {
            Knowledge k = hits.get(i);
            material.append(i + 1).append(". ").append(k.getTitle()).append('\n')
                    .append(brief(k.getContent(), KNOWLEDGE_MAX_LEN)).append('\n');
        }
        context.put("knowledge", material.toString());

        String titles = hits.stream().map(Knowledge::getTitle).collect(Collectors.joining("、"));
        return "命中 " + hits.size() + " 条：" + titles;
    }

    /**
     * 大模型节点：组提示词 → 调模型 → 逐字往前端推。
     *
     * 消息顺序是 system → 历史对话 → （参考资料 + 本次提问），
     * 把资料拼在最后一条 user 里而不是塞进 system：
     * 资料是“本次相关”的，放 system 会让模型误以为它对整个对话都成立。
     */
    private LlmClient.LlmResult runLlm(SseEmitter emitter, GraphDTO.Node node, Agent agent,
                                       Long conversationId, Long questionId,
                                       Map<String, Object> context) {
        Map<String, Object> data = node.getData();

        // 节点没指定模型就用智能体的默认模型
        Long modelId = longOf(data.get("modelConfigId"));
        if (modelId == null) {
            modelId = agent.getModelConfigId();
        }
        if (modelId == null) {
            throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
        }

        ModelConfig model = modelConfigService.getRaw(modelId);
        if (model.getStatus() != null && model.getStatus() == ModelConfig.STATUS_OFF) {
            throw new BusinessException(ResultCode.MODEL_DISABLED);
        }
        // 本地 Ollama 不需要 Key，其他厂商没填就直接报清楚，
        // 别等调到一半才回一个 401 让人猜
        if (!"ollama".equalsIgnoreCase(model.getProvider()) && !StringUtils.hasText(model.getApiKey())) {
            throw new BusinessException(ResultCode.MODEL_KEY_MISSING);
        }

        List<Map<String, String>> messages = new ArrayList<>();

        String systemPrompt = (String) data.get("systemPrompt");
        if (StringUtils.hasText(systemPrompt)) {
            messages.add(Map.of("role", Message.ROLE_SYSTEM, "content", systemPrompt));
        }

        // 带上历史，模型才能听懂“那第二种呢”这种跟问
        if (boolOf(data.get("useHistory"), true)) {
            int limit = intOf(data.get("historyLimit"), DEFAULT_HISTORY_LIMIT);
            for (Message history : messageService.listRecentHistory(conversationId, limit, questionId)) {
                messages.add(Map.of("role", history.getRole(), "content", history.getContent()));
            }
        }

        String question = String.valueOf(context.get("question"));
        Object material = context.get("knowledge");
        String userContent = material == null
                ? question
                : "参考资料：\n" + material + "\n请优先依据上面的资料回答下面的问题，"
                        + "资料里没提到的就说不确定。\n问题：" + question;
        messages.add(Map.of("role", Message.ROLE_USER, "content", userContent));

        BigDecimal temperature = decimalOf(data.get("temperature"));

        LlmClient.LlmResult result = llmClient.chatStream(model, messages, temperature, piece -> {
            try {
                send(emitter, "delta", Map.of("content", piece));
            } catch (Exception e) {
                // 客户端关页了。抛出去中断后续生成，不再白烧 token
                throw new IllegalStateException("客户端已断开", e);
            }
        });

        if (result.getTokenUsage() != null) {
            context.put("tokenUsage", result.getTokenUsage());
        }
        return result;
    }

    /**
     * 往 SSE 推一个事件。name 就是前端判断类型的依据。
     */
    private void send(SseEmitter emitter, String name, Object data) throws Exception {
        emitter.send(SseEmitter.event().name(name).data(toJson(data)));
    }

    /**
     * 取节点标题，没填就用 id 兑
     */
    private String titleOf(GraphDTO.Node node) {
        Object title = node.getData() == null ? null : node.getData().get("title");
        return title == null || !StringUtils.hasText(title.toString()) ? node.getId() : title.toString();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("序列化失败", e);
            return "{}";
        }
    }

    /**
     * 截断过长的文本，避免轨迹与错误消息超出字段长度
     */
    private String brief(String text, int max) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String clean = text.strip();
        return clean.length() > max ? clean.substring(0, max) + "..." : clean;
    }

    // ---- data 里的值来自 JSON，类型不固定，下面几个方法统一接住 ----

    private int intOf(Object value, int def) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {
                return def;
            }
        }
        return def;
    }

    private Long longOf(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return Long.parseLong(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private boolean boolOf(Object value, boolean def) {
        if (value instanceof Boolean b) {
            return b;
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            return Boolean.parseBoolean(str.trim());
        }
        return def;
    }

    /**
     * 温度返回 null 时 LlmClient 会回退到模型配置里的值
     */
    private BigDecimal decimalOf(Object value) {
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        if (value instanceof String str && StringUtils.hasText(str)) {
            try {
                return new BigDecimal(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
