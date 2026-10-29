package com.example.service;

import com.example.common.config.WeChatProperties;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 微信小程序登录服务
 *
 * 用 JDK 自带的 HttpClient 调 jscode2session，不额外引官方 SDK。
 * 流程：wx.login() 拿 code → 这里换 openid → 前端只拿 token。
 */
@Service
public class WeChatService {

    private static final String JSCODE2SESSION = "https://api.weixin.qq.com/sns/jscode2session";

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private WeChatProperties weChatProperties;

    /**
     * 用 code 换 openid
     *
     * @param code wx.login() 拿到的临时凭证，五分钟内有效、只能用一次
     */
    public String getOpenId(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "缺少登录 code");
        }
        if (!StringUtils.hasText(weChatProperties.getAppid())
                || !StringUtils.hasText(weChatProperties.getSecret())) {
            throw new BusinessException(ResultCode.ERROR.getCode(), "未配置 wechat.appid / wechat.secret");
        }

        String url = JSCODE2SESSION
                + "?appid=" + weChatProperties.getAppid()
                + "&secret=" + weChatProperties.getSecret()
                + "&js_code=" + code
                + "&grant_type=authorization_code";

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode node = mapper.readTree(response.body());

            String openid = node.path("openid").asText(null);
            if (StringUtils.hasText(openid)) {
                return openid;
            }
            int errcode = node.path("errcode").asInt(-1);
            String errmsg = node.path("errmsg").asText("unknown");
            throw new BusinessException(ResultCode.ERROR.getCode(),
                    "微信登录失败：" + errmsg + "（errcode " + errcode + "）");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ResultCode.ERROR.getCode(),
                    "请求微信服务器失败：" + e.getMessage());
        }
    }
}
