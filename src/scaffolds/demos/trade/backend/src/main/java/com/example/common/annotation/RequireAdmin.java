package com.example.common.annotation;

import java.lang.annotation.*;

/**
 * 管理员权限注解
 * 标记在方法上，只有 role=admin 的用户可以访问
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireAdmin {
}
