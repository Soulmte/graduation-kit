package com.example.controller;

import com.example.common.util.UserContext;
import com.example.dto.ChatDTO;
import com.example.service.AgentExecuteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 对话控制器
 *
 * 这个类的返回值不是 Result 而是 SseEmitter —— 脚手架里没有 ResponseBodyAdvice，
 * 各 Controller 自己决定返回什么，所以这里不会被统一包装。
 *
 * 前端不能用原生 EventSource 接这个接口：EventSource 无法自定义请求头，
 * 带不上 Authorization，会被 JwtInterceptor 直接拦掉。
 * 正确做法是 fetch + ReadableStream 手动读，前端 api/chat.js 里有实现。
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private AgentExecuteService agentExecuteService;

    /**
     * 流式对话。
     *
     * 用 POST 而不是 GET：提问可能很长，塞 query 参数会超长度限制，
     * 而且日志里会留下用户问的全部内容。SSE 并不要求必须是 GET。
     *
     * 事件类型见 AgentExecuteService 的注释：meta / trace / delta / done / error。
     *
     * 没打 @Log：LogAspect 记的是“方法返回了”的耗时，而这个方法一上来就
     * 把 SseEmitter 返回了，真正的执行在另一个线程里，记出来的耗时永远是个位数，
     * 反而容易让人误以为对话很快。对话的耗时与轨迹已经存在 message 表里了。
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestBody @Valid ChatDTO dto) {
        return agentExecuteService.streamChat(dto, UserContext.getUserId());
    }
}
