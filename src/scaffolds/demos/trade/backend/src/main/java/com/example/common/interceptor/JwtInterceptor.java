package com.example.common.interceptor;

import com.example.common.annotation.RequireAdmin;
import com.example.common.annotation.RequireMerchant;
import com.example.common.result.Result;
import com.example.common.result.ResultCode;
import com.example.common.util.JwtUtil;
import com.example.common.util.UserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.PrintWriter;

/**
 * JWT认证拦截器
 * 校验Token有效性，解析用户信息，并处理 @RequireAdmin / @RequireMerchant 权限
 */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String token = request.getHeader("Authorization");

        if (token == null || !token.startsWith("Bearer ")) {
            writeError(response, ResultCode.UNAUTHORIZED.getCode(), "未授权，请先登录");
            return false;
        }

        Claims claims;
        try {
            claims = JwtUtil.parseToken(token.substring(7));
        } catch (Exception e) {
            writeError(response, ResultCode.UNAUTHORIZED.getCode(), "Token无效或已过期");
            return false;
        }

        String role = claims.get("role", String.class);

        // 用户信息存入request，供业务代码通过UserContext读取
        Object userId = claims.get("userId");
        request.setAttribute(UserContext.USER_ID, userId == null ? null : Long.valueOf(userId.toString()));
        request.setAttribute(UserContext.USERNAME, claims.getSubject());
        request.setAttribute(UserContext.ROLE, role);

        // 管理员权限校验
        if (needAdmin(handler) && !"admin".equals(role)) {
            writeError(response, ResultCode.FORBIDDEN.getCode(), "权限不足，禁止访问");
            return false;
        }

        // 商家权限校验：商家本人或管理员均可通过
        if (needMerchant(handler) && !"merchant".equals(role) && !"admin".equals(role)) {
            writeError(response, ResultCode.FORBIDDEN.getCode(), "仅商家可访问，请先申请开店");
            return false;
        }

        return true;
    }

    /**
     * 判断目标方法或所在类是否标记了@RequireAdmin
     */
    private boolean needAdmin(Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return false;
        }
        return handlerMethod.getMethodAnnotation(RequireAdmin.class) != null
                || handlerMethod.getBeanType().isAnnotationPresent(RequireAdmin.class);
    }

    /**
     * 判断目标方法或所在类是否标记了@RequireMerchant
     */
    private boolean needMerchant(Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return false;
        }
        return handlerMethod.getMethodAnnotation(RequireMerchant.class) != null
                || handlerMethod.getBeanType().isAnnotationPresent(RequireMerchant.class);
    }

    /**
     * 返回错误JSON响应
     */
    private void writeError(HttpServletResponse response, Integer code, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");
        try (PrintWriter writer = response.getWriter()) {
            writer.write(objectMapper.writeValueAsString(Result.build(code, message)));
        }
    }
}
