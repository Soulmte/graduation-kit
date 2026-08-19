package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 会话重命名入参
 */
@Data
public class ConversationRenameDTO {

    /**
     * 新标题
     */
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题不能超过100字")
    private String title;
}
