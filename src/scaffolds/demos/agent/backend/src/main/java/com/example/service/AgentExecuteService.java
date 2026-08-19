package com.example.service;

import com.example.dto.ChatDTO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 智能体执行引擎
 *
 * 负责按画布把一次提问跑完：从 start 节点顺着连线一路走到 end，
 * 每个节点做自己的事，llm 节点边生成边往 SseEmitter 里推。
 */
public interface AgentExecuteService {

    /**
     * 流式执行一次对话。方法会立刻返回 emitter，真正的执行在另一个线程里跑。
     *
     * 推给前端的事件有五种：
     *   meta  - 会话ID与消息ID，前端拿它更新地址栏与列表
     *   trace - 某个节点执行完了，附带耗时与产出摘要
     *   delta - 模型吐出的增量文本，前端追加到气泡里
     *   done  - 全部完成，附带 token 用量与总耗时
     *   error - 出错了，附带原因
     *
     * @param dto    提问入参
     * @param userId 当前登录用户
     */
    SseEmitter streamChat(ChatDTO dto, Long userId);
}
