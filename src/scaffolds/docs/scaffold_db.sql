-- ----------------------------------------------------------------------------
-- 毕业设计脚手架数据库初始化脚本
-- 数据库：scaffold_db      字符集：utf8mb4      引擎：InnoDB
-- 适用于全部 6 个后端脚手架（Spring Boot / Express / Flask / FastAPI / Go / .NET）
--
-- 执行方式（Windows 下必需指定字符集，否则中文会报 Data too long）：
--   mysql -u root -p --default-character-set=utf8mb4 < scaffold_db.sql
-- ----------------------------------------------------------------------------

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `scaffold_db`;
CREATE DATABASE `scaffold_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `scaffold_db`;

-- ----------------------------------------------------------------------------
-- 用户表
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `username`    VARCHAR(50)  NOT NULL                          COMMENT '用户名',
  `password`    VARCHAR(100) NOT NULL                          COMMENT '密码（毕设演示为明文存储）',
  `nickname`    VARCHAR(50)  DEFAULT NULL                      COMMENT '昵称',
  `age`         INT          DEFAULT NULL                      COMMENT '年龄',
  `gender`      VARCHAR(10)  DEFAULT NULL                      COMMENT '性别：male/female/other',
  `phone`       VARCHAR(20)  DEFAULT NULL                      COMMENT '手机号',
  `email`       VARCHAR(100) DEFAULT NULL                      COMMENT '邮箱',
  `role`        VARCHAR(20)  NOT NULL DEFAULT 'user'           COMMENT '角色：admin-管理员，user-普通用户',
  `avatar`      VARCHAR(255) DEFAULT NULL                      COMMENT '头像URL',
  `create_time` DATETIME     DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT      NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`, `deleted`),
  KEY `idx_role` (`role`),
  KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- ----------------------------------------------------------------------------
-- 公告表
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notice`;
CREATE TABLE `notice` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `title`       VARCHAR(200) NOT NULL                          COMMENT '公告标题',
  `content`     TEXT                                           COMMENT '公告内容',
  `create_by`   VARCHAR(50)  DEFAULT NULL                      COMMENT '发布人用户名',
  `create_time` DATETIME     DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT      NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_title` (`title`),
  KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '公告表';

-- ----------------------------------------------------------------------------
-- 操作日志表
-- 日志只写入与查询，不做逻辑删除
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `operation_log`;
CREATE TABLE `operation_log` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT          COMMENT '主键ID',
  `username`     VARCHAR(50)  DEFAULT NULL                     COMMENT '操作用户名',
  `operation`    VARCHAR(100) DEFAULT NULL                     COMMENT '操作描述',
  `method`       VARCHAR(200) DEFAULT NULL                     COMMENT '请求方法',
  `params`       TEXT                                          COMMENT '请求参数（密码已脱敏）',
  `execute_time` BIGINT       DEFAULT NULL                     COMMENT '执行时长（毫秒）',
  `ip`           VARCHAR(50)  DEFAULT NULL                     COMMENT 'IP地址',
  `create_time`  DATETIME     DEFAULT NULL                     COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '操作日志表';

-- ----------------------------------------------------------------------------
-- 初始化数据
-- 密码为明文，仅用于毕设演示
-- ----------------------------------------------------------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `age`, `gender`, `phone`, `email`, `role`, `create_time`, `update_time`) VALUES
('admin', '123456', '系统管理员', 28, 'male',   '13800000001', 'admin@example.com', 'admin', NOW(), NOW()),
('test',  '123456', '测试用户',   22, 'female', '13800000002', 'test@example.com',  'user',  NOW(), NOW()),
('zhang', '123456', '张三',       25, 'male',   '13800000003', 'zhang@example.com', 'user',  NOW(), NOW());

INSERT INTO `notice` (`title`, `content`, `create_by`, `create_time`, `update_time`) VALUES
('系统上线通知', '本系统已完成部署，欢迎使用。初始管理员账号 admin，密码 123456。', 'admin', NOW(), NOW()),
('使用说明',     '普通用户只能查看与修改自己的信息，管理员可管理全部数据。',       'admin', NOW(), NOW());
