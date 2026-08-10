package com.example.common.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 当前登录用户上下文
 * 数据由 JwtInterceptor 解析 Token 后写入 request
 */
public class UserContext {

    public static final String USER_ID = "currentUserId";
    public static final String USERNAME = "currentUsername";
    public static final String ROLE = "currentRole";

    private static HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes)
                RequestContextHolder.getRequestAttributes();
        return attributes == null ? null : attributes.getRequest();
    }

    /**
     * 获取当前登录用户ID，未登录返回null
     */
    public static Long getUserId() {
        HttpServletRequest request = getRequest();
        return request == null ? null : (Long) request.getAttribute(USER_ID);
    }

    /**
     * 获取当前登录用户名，未登录返回null
     */
    public static String getUsername() {
        HttpServletRequest request = getRequest();
        return request == null ? null : (String) request.getAttribute(USERNAME);
    }

    /**
     * 获取当前登录用户角色，未登录返回null
     */
    public static String getRole() {
        HttpServletRequest request = getRequest();
        return request == null ? null : (String) request.getAttribute(ROLE);
    }

    /**
     * 判断当前用户是否为管理员
     */
    public static boolean isAdmin() {
        return "admin".equals(getRole());
    }

    /**
     * 判断当前用户是否为服务方
     */
    public static boolean isProvider() {
        return "provider".equals(getRole());
    }
}
