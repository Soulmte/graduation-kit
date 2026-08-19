package com.example.service;

import com.example.entity.ModelConfig;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * 大模型调用客户端
 *
 * 只对接 OpenAI 兼容协议（POST {baseUrl}/v1/chat/completions），
 * DeepSeek、通义、Kimi、本地 Ollama 都走这一套，换厂商只改 model_config 表。
 */
public interface LlmClient {

    /**
     * 非流式调用，等模型全部生成完再返回
     */
    LlmResult chat(ModelConfig config, List<Map<String, String>> messages, BigDecimal temperature);

    /**
     * 流式调用。每收到一个增量片段就回调 onDelta，方法返回时已生成完毕。
     *
     * @param onDelta 增量文本回调，注意会被调用很多次，回调里别做重活
     */
    LlmResult chatStream(ModelConfig config, List<Map<String, String>> messages,
                         BigDecimal temperature, Consumer<String> onDelta);

    /**
     * 调用结果
     */
    @Data
    class LlmResult {
        /**
         * 完整回复文本
         */
        private String content;

        /**
         * 消耗的 token 数，部分服务不返回则为 null
         */
        private Integer tokenUsage;
    }
}
