package com.example.service.impl;

import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.entity.ModelConfig;
import com.example.service.LlmClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * 大模型调用实现
 *
 * 用 JDK 内置的 java.net.http.HttpClient，不引 OkHttp 也不引各家 SDK：
 * 少一个依赖，毕设答辩时也能讲清"请求是怎么发出去的"。
 *
 * 流式的原理：请求体带 stream:true，服务端按 SSE 返回，
 * 每行形如 data: {"choices":[{"delta":{"content":"你"}}]}，
 * 收到 data: [DONE] 表示结束。这里逐行读、逐行解析、逐行回调。
 */
@Slf4j
@Service
public class LlmClientImpl implements LlmClient {

    /** 兼容 OpenAI 协议的对话补全路径 */
    private static final String CHAT_PATH = "/v1/chat/completions";

    /** SSE 行前缀 */
    private static final String DATA_PREFIX = "data:";

    /** SSE 结束标记 */
    private static final String DONE_FLAG = "[DONE]";

    private final ObjectMapper objectMapper;

    public LlmClientImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public LlmResult chat(ModelConfig config, List<Map<String, String>> messages, BigDecimal temperature) {
        HttpResponse<String> response;
        try {
            HttpClient client = buildClient(config);
            HttpRequest request = buildRequest(config, messages, temperature, false);
            response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(), "模型请求被中断");
        } catch (Exception e) {
            log.error("调用模型失败，configId={}", config.getId(), e);
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(),
                    "调用模型失败：" + e.getMessage());
        }

        if (response.statusCode() != 200) {
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(),
                    "模型返回异常状态 " + response.statusCode() + "：" + brief(response.body()));
        }

        try {
            JsonNode root = objectMapper.readTree(response.body());
            LlmResult result = new LlmResult();
            result.setContent(root.path("choices").path(0).path("message").path("content").asText(""));
            JsonNode usage = root.path("usage").path("total_tokens");
            result.setTokenUsage(usage.isMissingNode() ? null : usage.asInt());
            return result;
        } catch (Exception e) {
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(),
                    "解析模型响应失败：" + e.getMessage());
        }
    }

    @Override
    public LlmResult chatStream(ModelConfig config, List<Map<String, String>> messages,
                               BigDecimal temperature, Consumer<String> onDelta) {
        StringBuilder full = new StringBuilder();
        Integer tokenUsage = null;

        try {
            HttpClient client = buildClient(config);
            HttpRequest request = buildRequest(config, messages, temperature, true);
            HttpResponse<java.io.InputStream> response =
                    client.send(request, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() != 200) {
                String body = new String(response.body().readAllBytes(), StandardCharsets.UTF_8);
                throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(),
                        "模型返回异常状态 " + response.statusCode() + "：" + brief(body));
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // SSE 用空行分隔事件，还可能发 : 开头的心跳注释，都直接跳过
                    if (line.isBlank() || !line.startsWith(DATA_PREFIX)) {
                        continue;
                    }
                    String payload = line.substring(DATA_PREFIX.length()).trim();
                    if (DONE_FLAG.equals(payload)) {
                        break;
                    }

                    JsonNode chunk = objectMapper.readTree(payload);
                    JsonNode delta = chunk.path("choices").path(0).path("delta");
                    String piece = delta.path("content").asText("");
                    if (!piece.isEmpty()) {
                        full.append(piece);
                        onDelta.accept(piece);
                    }

                    // 部分服务会在最后一个 chunk 里带上用量
                    JsonNode usage = chunk.path("usage").path("total_tokens");
                    if (!usage.isMissingNode() && usage.asInt() > 0) {
                        tokenUsage = usage.asInt();
                    }
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(), "模型请求被中断");
        } catch (Exception e) {
            log.error("流式调用模型失败，configId={}", config.getId(), e);
            throw new BusinessException(ResultCode.MODEL_CALL_FAILED.getCode(),
                    "调用模型失败：" + e.getMessage());
        }

        LlmResult result = new LlmResult();
        result.setContent(full.toString());
        result.setTokenUsage(tokenUsage);
        return result;
    }

    /**
     * 建 HttpClient。这里的 timeout 是“建连接”的超时，
     * 读响应的超时在 HttpRequest 上单独设。
     */
    private HttpClient buildClient(ModelConfig config) {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /**
     * 组装请求。stream 为 true 时服务端改用 SSE 返回。
     */
    private HttpRequest buildRequest(ModelConfig config, List<Map<String, String>> messages,
                                     BigDecimal temperature, boolean stream) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", config.getModel());
        body.put("messages", messages);
        // 节点上可以覆盖温度，没填则用模型配置里的值
        body.put("temperature", temperature != null ? temperature : config.getTemperature());
        body.put("max_tokens", config.getMaxTokens());
        body.put("stream", stream);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(normalizeUrl(config.getBaseUrl()) + CHAT_PATH))
                .timeout(Duration.ofSeconds(config.getTimeout() != null ? config.getTimeout() : 60))
                .header("Content-Type", "application/json")
                .header("Accept", stream ? "text/event-stream" : "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));

        // 本地 Ollama 不需要鉴权，Key 为空时就不带这个头
        if (StringUtils.hasText(config.getApiKey())) {
            builder.header("Authorization", "Bearer " + config.getApiKey().trim());
        }
        return builder.build();
    }

    /**
     * 去掉末尾斜杠，避免拼出 //v1/chat/completions
     */
    private String normalizeUrl(String baseUrl) {
        String url = baseUrl.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    /**
     * 错误体可能很长（网关的 HTML 错误页），截短后再拼进提示
     */
    private String brief(String body) {
        if (!StringUtils.hasText(body)) {
            return "无响应内容";
        }
        String text = body.replaceAll("\\s+", " ").trim();
        return text.length() > 200 ? text.substring(0, 200) + "..." : text;
    }
}
