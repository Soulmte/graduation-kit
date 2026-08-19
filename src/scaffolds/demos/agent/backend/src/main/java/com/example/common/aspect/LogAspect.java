package com.example.common.aspect;

import com.example.common.annotation.Log;
import com.example.common.util.UserContext;
import com.example.entity.OperationLog;
import com.example.service.OperationLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 操作日志切面
 * 拦截带有@Log注解的方法，记录操作日志（包括失败场景）
 */
@Slf4j
@Aspect
@Component
public class LogAspect {

    @Autowired
    private OperationLogService operationLogService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 定义切点：拦截所有带@Log注解的方法
     */
    @Pointcut("@annotation(com.example.common.annotation.Log)")
    public void logPointcut() {
    }

    /**
     * 环绕通知：在方法执行前后记录日志
     * 即使方法抛出异常，日志也会被记录
     */
    @Around("logPointcut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();

        // 提前提取用户名（防止handler执行后取不到）
        String username = extractUsername(point);

        Throwable error = null;
        Object result = null;
        try {
            result = point.proceed();
        } catch (Throwable e) {
            error = e;
            throw e;
        } finally {
            long executeTime = System.currentTimeMillis() - startTime;
            buildAndSaveLog(point, username, executeTime, error);
        }
        return result;
    }

    /**
     * 提取用户名：优先取拦截器解析好的上下文，登录/注册时从请求参数取
     */
    private String extractUsername(ProceedingJoinPoint point) {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Log logAnnotation = signature.getMethod().getAnnotation(Log.class);

        // 已登录请求由JwtInterceptor写入上下文
        String username = UserContext.getUsername();
        if (username != null) {
            return username;
        }

        // 登录/注册接口无Token，从参数中反射获取username
        if (logAnnotation.value().contains("登录") || logAnnotation.value().contains("注册")) {
            Object[] args = point.getArgs();
            if (args != null && args.length > 0 && args[0] != null) {
                try {
                    java.lang.reflect.Field field = args[0].getClass().getDeclaredField("username");
                    field.setAccessible(true);
                    Object usernameObj = field.get(args[0]);
                    if (usernameObj != null) {
                        return usernameObj.toString();
                    }
                } catch (Exception e) {
                    log.debug("无法从参数中获取用户名: {}", e.getMessage());
                }
            }
        }

        return "anonymous";
    }

    /**
     * 组装日志对象并交由Service异步写入
     * 异步必须跨Bean调用才会生效，因此@Async标在Service上而不是本类
     */
    private void buildAndSaveLog(ProceedingJoinPoint point, String username, long executeTime, Throwable error) {
        try {
            MethodSignature signature = (MethodSignature) point.getSignature();
            Log logAnnotation = signature.getMethod().getAnnotation(Log.class);

            String ip = "unknown";
            ServletRequestAttributes attributes = (ServletRequestAttributes)
                    RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                ip = getIpAddress(attributes.getRequest());
            }

            // 失败时在操作描述后追加标记
            String operation = logAnnotation.value();
            if (error != null) {
                operation = operation + "[失败:" + error.getMessage() + "]";
                if (operation.length() > 100) operation = operation.substring(0, 100);
            }

            OperationLog operationLog = new OperationLog();
            operationLog.setUsername(username);
            operationLog.setOperation(operation);
            operationLog.setMethod(signature.getDeclaringTypeName() + "." + signature.getName());
            operationLog.setExecuteTime(executeTime);
            operationLog.setIp(ip);

            // 保存请求参数
            if (logAnnotation.saveParams()) {
                Object[] args = point.getArgs();
                if (args != null && args.length > 0) {
                    try {
                        String params = objectMapper.writeValueAsString(args);
                        // 脱敏：隐藏密码字段
                        params = params.replaceAll("(\"password\"\\s*:\\s*)\"[^\"]*\"", "$1\"***\"");
                        if (params.length() > 2000) {
                            params = params.substring(0, 2000) + "...";
                        }
                        operationLog.setParams(params);
                    } catch (Exception e) {
                        operationLog.setParams("参数序列化失败");
                    }
                }
            }

            operationLogService.saveAsync(operationLog);

        } catch (Exception e) {
            log.error("组装操作日志失败: ", e);
        }
    }

    /**
     * 获取客户端IP地址
     */
    private String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
