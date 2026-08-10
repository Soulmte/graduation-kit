package com.example.common.annotation;

import java.lang.annotation.*;

/**
 * 服务方权限注解
 * 标记在方法或类上，只有 role=provider 或 role=admin 的用户可以访问。
 * 放行 admin 是为了让管理员能进机构端排查问题，不必另建账号。
 *
 * 注意：本注解只校验"是不是服务方"，不校验"是不是这家机构的东西"。
 * 数据归属校验在 Service 层做，见 ProviderServiceImpl#requireMyProvider
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireProvider {
}
