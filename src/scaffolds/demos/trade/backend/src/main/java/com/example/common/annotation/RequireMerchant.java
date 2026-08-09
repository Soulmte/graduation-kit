package com.example.common.annotation;

import java.lang.annotation.*;

/**
 * 商家权限注解
 * 标记在方法或类上，只有 role=merchant 或 role=admin 的用户可以访问。
 * 放行 admin 是为了让管理员能进商家端排查问题，不必另建账号。
 *
 * 注意：本注解只校验"是不是商家"，不校验"是不是这家店的东西"。
 * 数据归属校验在 Service 层做，见 MerchantServiceImpl#requireMyMerchant
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireMerchant {
}
