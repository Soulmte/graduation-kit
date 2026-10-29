package com.example.dto;

import lombok.Data;

/**
 * 小程序登录入参
 */
@Data
public class WxLoginDTO {

    /**
     * wx.login() 换到的临时 code，五分钟内有效
     */
    private String code;
}
