package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发起对话入参
 *
 * conversationId 为空表示开新会话，后端建好后通过 SSE 的 meta 事件把 ID 回给前端。
 */
@Data
public class ChatDTO {

    /**
     * 智能体ID
     */
    @NotNull(message = "请选择智能体")
    private Long agentId;

    /**
     * 会话ID，为空表示新建会话
     */
    private Long conversationId;

    /**
     * 用户提问
     */
    @NotBlank(message = "提问内容不能为空")
    @Size(max = 2000, message = "提问不能超过2000字")
    private String question;
}
