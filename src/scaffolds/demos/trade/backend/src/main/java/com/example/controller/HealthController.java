package com.example.controller;

import com.example.common.result.Result;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@Slf4j
@RestController
@RequestMapping("/api")
public class HealthController {

    @Resource
    private DataSource dataSource;

    /**
     * 健康检查
     * 同时验证数据库连通性
     */
    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("service", "Spring Boot");
        data.put("database", checkDatabase());
        return Result.success(data);
    }

    private String checkDatabase() {
        try {
            new JdbcTemplate(dataSource).queryForObject("SELECT 1", Integer.class);
            return "ok";
        } catch (Exception e) {
            // 不向外暴露异常详情，避免泄露数据库连接信息
            log.error("数据库连接异常：", e);
            return "error";
        }
    }
}
