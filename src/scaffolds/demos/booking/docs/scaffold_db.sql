-- ----------------------------------------------------------------------------
-- 预约类毕业设计 Demo 数据库初始化脚本
-- 数据库：scaffold_db      字符集：utf8mb4      引擎：InnoDB
--
-- 在基础脚手架（user / notice / operation_log）之上，增加一套通用预约模型：
--   服务方 provider → 服务分类 service_category → 服务项 service_item
--   排班时段 time_slot → 预约单 appointment → 服务评价 review
--
-- 与交易类的区别：卖的不是货而是"某个时间段的服务能力"，
-- 所以库存换成了时段容量，支付环节换成了到店核销。
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
  `role`        VARCHAR(20)  NOT NULL DEFAULT 'user'           COMMENT '角色：admin-管理员，provider-服务方，user-普通用户',
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
-- 服务方表
-- 一个用户最多开一家机构，user_id 唯一。审核通过后才能发布服务
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `provider`;
CREATE TABLE `provider` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT         COMMENT '主键ID',
  `user_id`       BIGINT       NOT NULL                        COMMENT '所属用户ID（逻辑关联 user.id）',
  `name`          VARCHAR(100) NOT NULL                        COMMENT '机构名称',
  `logo`          VARCHAR(255) DEFAULT NULL                    COMMENT '机构头像URL',
  `description`   VARCHAR(500) DEFAULT NULL                    COMMENT '机构简介',
  `address`       VARCHAR(255) DEFAULT NULL                    COMMENT '到店地址',
  `contact_phone` VARCHAR(20)  DEFAULT NULL                    COMMENT '联系电话',
  `open_time`     VARCHAR(50)  DEFAULT NULL                    COMMENT '营业时间文案，如 09:00-18:00',
  `status`        TINYINT      NOT NULL DEFAULT 0              COMMENT '状态：0-待审核，1-正常，2-已封禁',
  `create_time`   DATETIME     DEFAULT NULL                    COMMENT '创建时间',
  `update_time`   DATETIME     DEFAULT NULL                    COMMENT '更新时间',
  `deleted`       TINYINT      NOT NULL DEFAULT 0              COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`, `deleted`),
  KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '服务方表';

-- ----------------------------------------------------------------------------
-- 服务分类表
-- 平铺单层分类，管理员维护
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `service_category`;
CREATE TABLE `service_category` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `name`        VARCHAR(50) NOT NULL                          COMMENT '分类名称',
  `sort`        INT         NOT NULL DEFAULT 0                COMMENT '排序值，越小越靠前',
  `create_time` DATETIME    DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME    DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT     NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`, `deleted`),
  KEY `idx_sort` (`sort`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '服务分类表';

-- ----------------------------------------------------------------------------
-- 服务项表
-- duration 是单次服务时长，生成排班时按它切时段
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `service_item`;
CREATE TABLE `service_item` (
  `id`          BIGINT         NOT NULL AUTO_INCREMENT        COMMENT '主键ID',
  `provider_id` BIGINT         NOT NULL                       COMMENT '所属机构ID',
  `category_id` BIGINT         DEFAULT NULL                   COMMENT '分类ID',
  `name`        VARCHAR(200)   NOT NULL                       COMMENT '服务名称',
  `cover`       VARCHAR(255)   DEFAULT NULL                   COMMENT '封面图URL',
  `description` TEXT                                          COMMENT '服务详情（富文本）',
  `price`       DECIMAL(10, 2) NOT NULL DEFAULT 0.00          COMMENT '单次价格（元）',
  `duration`    INT            NOT NULL DEFAULT 60            COMMENT '单次服务时长（分钟）',
  `booked`      INT            NOT NULL DEFAULT 0             COMMENT '累计预约人数',
  `status`      TINYINT        NOT NULL DEFAULT 0             COMMENT '状态：0-下线，1-上线',
  `create_time` DATETIME       DEFAULT NULL                   COMMENT '创建时间',
  `update_time` DATETIME       DEFAULT NULL                   COMMENT '更新时间',
  `deleted`     TINYINT        NOT NULL DEFAULT 0             COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '服务项表';

-- ----------------------------------------------------------------------------
-- 排班时段表
-- 预约类系统的核心：卖的不是货，而是“某个时间段的服务能力”。
-- capacity 对应商品的库存，booked_count 是已占用名额，
-- 两者分开存，抢名额时用 booked_count < capacity 做条件更新。
--
-- 同一服务项 + 同一天 + 同一开始时间只能有一条，否则名额会算重。
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `time_slot`;
CREATE TABLE `time_slot` (
  `id`              BIGINT   NOT NULL AUTO_INCREMENT          COMMENT '主键ID',
  `provider_id`     BIGINT   NOT NULL                         COMMENT '所属机构ID（冗余存储，方便按机构查排班）',
  `service_item_id` BIGINT   NOT NULL                         COMMENT '服务项ID',
  `slot_date`       DATE     NOT NULL                         COMMENT '服务日期',
  `start_time`      TIME     NOT NULL                         COMMENT '开始时间',
  `end_time`        TIME     NOT NULL                         COMMENT '结束时间（开始时间 + 服务时长）',
  `capacity`        INT      NOT NULL DEFAULT 1               COMMENT '可接待名额',
  `booked_count`    INT      NOT NULL DEFAULT 0               COMMENT '已预约名额',
  `status`          TINYINT  NOT NULL DEFAULT 1               COMMENT '状态：0-已关闭，1-开放',
  `create_time`     DATETIME DEFAULT NULL                     COMMENT '创建时间',
  `update_time`     DATETIME DEFAULT NULL                     COMMENT '更新时间',
  `deleted`         TINYINT  NOT NULL DEFAULT 0               COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_date_start` (`service_item_id`, `slot_date`, `start_time`, `deleted`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_date` (`slot_date`),
  KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '排班时段表';

-- ----------------------------------------------------------------------------
-- 预约单表
-- 故意冗余服务名、价格、日期时间：预约单是历史凭证，
-- 机构后来改名改价或删时段，旧单显示的仍是预约时的信息。
--
-- 状态流转（status）：
--   0 待确认 --机构接单--> 1 已确认 --到店核销--> 2 已完成 --可评价
--   0 待确认 --机构拒单--> 4 已拒绝（释放名额）
--   0 / 1 --用户取消--> 3 已取消（释放名额）
--   1 已确认 --机构标记--> 5 已失约（时间已过，不释放名额）
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `appointment`;
CREATE TABLE `appointment` (
  `id`              BIGINT         NOT NULL AUTO_INCREMENT    COMMENT '主键ID',
  `appointment_no`  VARCHAR(32)    NOT NULL                   COMMENT '预约单号（展示与搜索用）',
  `user_id`         BIGINT         NOT NULL                   COMMENT '预约用户ID',
  `provider_id`     BIGINT         NOT NULL                   COMMENT '机构ID',
  `service_item_id` BIGINT         NOT NULL                   COMMENT '服务项ID',
  `time_slot_id`    BIGINT         NOT NULL                   COMMENT '时段ID',
  `service_name`    VARCHAR(200)   NOT NULL                   COMMENT '预约时的服务名称（快照）',
  `service_cover`   VARCHAR(255)   DEFAULT NULL               COMMENT '预约时的封面图（快照）',
  `price`           DECIMAL(10, 2) NOT NULL DEFAULT 0.00      COMMENT '预约时的价格（快照，单位元）',
  `slot_date`       DATE           NOT NULL                   COMMENT '服务日期（快照）',
  `start_time`      TIME           NOT NULL                   COMMENT '开始时间（快照）',
  `end_time`        TIME           NOT NULL                   COMMENT '结束时间（快照）',
  `status`          TINYINT        NOT NULL DEFAULT 0         COMMENT '状态：0-待确认，1-已确认，2-已完成，3-已取消，4-已拒绝，5-已失约',
  `contact_name`    VARCHAR(50)    DEFAULT NULL               COMMENT '联系人姓名',
  `contact_phone`   VARCHAR(20)    DEFAULT NULL               COMMENT '联系电话',
  `remark`          VARCHAR(255)   DEFAULT NULL               COMMENT '用户备注',
  `reject_reason`   VARCHAR(255)   DEFAULT NULL               COMMENT '拒单理由',
  `confirm_time`    DATETIME       DEFAULT NULL               COMMENT '确认时间',
  `finish_time`     DATETIME       DEFAULT NULL               COMMENT '核销完成时间',
  `cancel_time`     DATETIME       DEFAULT NULL               COMMENT '取消时间',
  `create_time`     DATETIME       DEFAULT NULL               COMMENT '创建时间',
  `update_time`     DATETIME       DEFAULT NULL               COMMENT '更新时间',
  `deleted`         TINYINT        NOT NULL DEFAULT 0         COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment_no` (`appointment_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_slot` (`time_slot_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`slot_date`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '预约单表';

-- ----------------------------------------------------------------------------
-- 服务评价表
-- 一单一评，所以 appointment_id 做唯一约束；只有已完成的单能评
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT      COMMENT '主键ID',
  `appointment_id`  BIGINT       NOT NULL                     COMMENT '预约单ID',
  `user_id`         BIGINT       NOT NULL                     COMMENT '评价用户ID',
  `provider_id`     BIGINT       NOT NULL                     COMMENT '机构ID（冗余，方便算机构均分）',
  `service_item_id` BIGINT       NOT NULL                     COMMENT '服务项ID（冗余，方便算服务均分）',
  `rating`          TINYINT      NOT NULL DEFAULT 5           COMMENT '评分：1~5 星',
  `content`         VARCHAR(500) DEFAULT NULL                 COMMENT '评价内容',
  `reply`           VARCHAR(500) DEFAULT NULL                 COMMENT '机构回复',
  `reply_time`      DATETIME     DEFAULT NULL                 COMMENT '回复时间',
  `create_time`     DATETIME     DEFAULT NULL                 COMMENT '创建时间',
  `update_time`     DATETIME     DEFAULT NULL                 COMMENT '更新时间',
  `deleted`         TINYINT      NOT NULL DEFAULT 0           COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment` (`appointment_id`, `deleted`),
  KEY `idx_provider` (`provider_id`),
  KEY `idx_item` (`service_item_id`),
  KEY `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '服务评价表';

-- ----------------------------------------------------------------------------
-- 初始化数据
-- 密码为明文，仅用于毕设演示
-- 下面的 INSERT 依赖自增主键顺序：user 1~5、provider 1~2、
-- service_category 1~4、service_item 1~6、time_slot 1~10
--
-- 时段日期故意用 CURDATE() 算相对日期，
-- 不写死 2024-01-01，否则过几天演示数据就全是过期时段了。
-- ----------------------------------------------------------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `age`, `gender`, `phone`, `email`, `role`, `create_time`, `update_time`) VALUES
('admin', '123456', '系统管理员', 28, 'male',   '13800000001', 'admin@example.com', 'admin',    NOW(), NOW()),
('test',  '123456', '测试用户',   22, 'female', '13800000002', 'test@example.com',  'user',     NOW(), NOW()),
('zhang', '123456', '张三',       25, 'male',   '13800000003', 'zhang@example.com', 'user',     NOW(), NOW()),
('shop1', '123456', '清河理发工作室', 35, 'male',   '13800000004', 'shop1@example.com', 'provider', NOW(), NOW()),
('shop2', '123456', '晚风台球馆',     30, 'female', '13800000005', 'shop2@example.com', 'provider', NOW(), NOW());

INSERT INTO `notice` (`title`, `content`, `create_by`, `create_time`, `update_time`) VALUES
('系统上线通知', '本系统已完成部署，欢迎使用。初始管理员账号 admin，密码 123456。', 'admin', NOW(), NOW()),
('机构入驻说明', '普通用户在个人中心可申请入驻，管理员审核通过后即可发布服务并排班。', 'admin', NOW(), NOW()),
('预约取消规则', '已确认的预约可在服务开始前取消，名额会释放给其他用户。',           'admin', NOW(), NOW());

-- 机构：shop1 已过审（status=1），shop2 待审核（status=0），方便演示审核流程
INSERT INTO `provider` (`user_id`, `name`, `description`, `address`, `contact_phone`, `open_time`, `status`, `create_time`, `update_time`) VALUES
(4, '清河理发工作室', '主营剪发、热染与护发，两位发型师驻店。', '杭州市西湖区文一路 88 号', '13800000004', '10:00-20:00', 1, NOW(), NOW()),
(5, '晚风台球馆',     '四张台球桌，支持按小时预约。',         '南京市玄武区中山路 5 号',   '13800000005', '09:00-22:00', 0, NOW(), NOW());

INSERT INTO `service_category` (`name`, `sort`, `create_time`, `update_time`) VALUES
('理发美发', 1, NOW(), NOW()),
('运动场馆', 2, NOW(), NOW()),
('体检医美', 3, NOW(), NOW()),
('培训辅导', 4, NOW(), NOW());

-- 服务项：1~4 属 shop1（已上线），5 已下线，6 上线但没排班，用于验证预约校验
INSERT INTO `service_item` (`provider_id`, `category_id`, `name`, `description`, `price`, `duration`, `booked`, `status`, `create_time`, `update_time`) VALUES
(1, 1, '总监剪发',     '<p>资深发型师操刀，含洗吹造型。</p>',       128.00, 60,  12, 1, NOW(), NOW()),
(1, 1, '创意热染',     '<p>进口染膏，含护色处理，耗时较长。</p>',   398.00, 120, 6,  1, NOW(), NOW()),
(1, 1, '头皮深层护理', '<p>清洁与按压两道工序。</p>',               168.00, 45,  9,  1, NOW(), NOW()),
(1, 1, '全头漂染套餐', '<p>漂色加上色，含两次护理。</p>',           299.00, 90,  3,  1, NOW(), NOW()),
(1, 1, '接发加长',     '<p>真人发分段接接。此服务已下线。</p>',       450.00, 60,  0,  0, NOW(), NOW()),
(1, 1, '新娘造型试妆', '<p>尚未排班，用于演示无可约时段。</p>',   680.00, 90,  0,  1, NOW(), NOW());

-- 排班：前两天到后三天的时段，覆盖可约、满额、已关闭、已过期四种情形
-- booked_count 已预先算好，与下面那批预约单对得上（已取消与已拒绝不占名额）
INSERT INTO `time_slot` (`provider_id`, `service_item_id`, `slot_date`, `start_time`, `end_time`, `capacity`, `booked_count`, `status`, `create_time`, `update_time`) VALUES
(1, 1, CURDATE() + INTERVAL 1 DAY, '10:00:00', '11:00:00', 1, 1, 1, NOW(), NOW()),
(1, 1, CURDATE() + INTERVAL 1 DAY, '11:00:00', '12:00:00', 1, 0, 1, NOW(), NOW()),
(1, 1, CURDATE() + INTERVAL 2 DAY, '10:00:00', '11:00:00', 1, 0, 1, NOW(), NOW()),
(1, 2, CURDATE() + INTERVAL 1 DAY, '14:00:00', '16:00:00', 1, 1, 1, NOW(), NOW()),
(1, 3, CURDATE() + INTERVAL 1 DAY, '15:00:00', '15:45:00', 2, 2, 1, NOW(), NOW()),
(1, 3, CURDATE() + INTERVAL 2 DAY, '15:00:00', '15:45:00', 2, 0, 1, NOW(), NOW()),
(1, 4, CURDATE() + INTERVAL 3 DAY, '09:00:00', '10:30:00', 3, 1, 1, NOW(), NOW()),
(1, 1, CURDATE() - INTERVAL 1 DAY, '10:00:00', '11:00:00', 1, 1, 1, NOW(), NOW()),
(1, 1, CURDATE() - INTERVAL 1 DAY, '14:00:00', '15:00:00', 1, 1, 1, NOW(), NOW()),
(1, 2, CURDATE() + INTERVAL 2 DAY, '14:00:00', '16:00:00', 1, 0, 0, NOW(), NOW());

-- 预约单：六种状态全部覆盖到，日期时间与上面对应的时段保持一致
INSERT INTO `appointment` (`appointment_no`, `user_id`, `provider_id`, `service_item_id`, `time_slot_id`, `service_name`, `price`, `slot_date`, `start_time`, `end_time`, `status`, `contact_name`, `contact_phone`, `remark`, `reject_reason`, `confirm_time`, `finish_time`, `cancel_time`, `create_time`, `update_time`) VALUES
('AP202401010001', 2, 1, 1, 8,  '总监剪发',     128.00, CURDATE() - INTERVAL 1 DAY, '10:00:00', '11:00:00', 2, '测试用户', '13800000002', '不要剪太短', NULL,       NOW(), NOW(), NULL,  NOW(), NOW()),
('AP202401010002', 2, 1, 1, 1,  '总监剪发',     128.00, CURDATE() + INTERVAL 1 DAY, '10:00:00', '11:00:00', 1, '测试用户', '13800000002', NULL,         NULL,       NOW(), NULL,  NULL,  NOW(), NOW()),
('AP202401010003', 2, 1, 2, 4,  '创意热染',     398.00, CURDATE() + INTERVAL 1 DAY, '14:00:00', '16:00:00', 0, '测试用户', '13800000002', '想染亚麻色', NULL,       NULL,  NULL,  NULL,  NOW(), NOW()),
('AP202401010004', 3, 1, 3, 5,  '头皮深层护理', 168.00, CURDATE() + INTERVAL 1 DAY, '15:00:00', '15:45:00', 1, '张三',     '13800000003', NULL,         NULL,       NOW(), NULL,  NULL,  NOW(), NOW()),
('AP202401010005', 2, 1, 3, 5,  '头皮深层护理', 168.00, CURDATE() + INTERVAL 1 DAY, '15:00:00', '15:45:00', 1, '测试用户', '13800000002', '与朋友同行', NULL,       NOW(), NULL,  NULL,  NOW(), NOW()),
('AP202401010006', 3, 1, 4, 7,  '全头漂染套餐', 299.00, CURDATE() + INTERVAL 3 DAY, '09:00:00', '10:30:00', 0, '张三',     '13800000003', '想要浅棕色',   NULL,     NULL,  NULL,  NULL,  NOW(), NOW()),
('AP202401010007', 2, 1, 4, 7,  '全头漂染套餐', 299.00, CURDATE() + INTERVAL 3 DAY, '09:00:00', '10:30:00', 3, '测试用户', '13800000002', NULL,         NULL,       NULL,  NULL,  NOW(), NOW(), NOW()),
('AP202401010008', 3, 1, 1, 3,  '总监剪发',     128.00, CURDATE() + INTERVAL 2 DAY, '10:00:00', '11:00:00', 4, '张三',     '13800000003', NULL,         '发型师当天临时请假', NULL, NULL, NULL, NOW(), NOW()),
('AP202401010009', 3, 1, 1, 9,  '总监剪发',     128.00, CURDATE() - INTERVAL 1 DAY, '14:00:00', '15:00:00', 5, '张三',     '13800000003', NULL,         NULL,       NOW(), NULL,  NULL,  NOW(), NOW());

-- 已完成的那单带一条评价，机构已回复
INSERT INTO `review` (`appointment_id`, `user_id`, `provider_id`, `service_item_id`, `rating`, `content`, `reply`, `reply_time`, `create_time`, `update_time`) VALUES
(1, 2, 1, 1, 5, '发型师很认真，剪完造型也比较好打理。', '感谢您的认可，欢迎下次再来。', NOW(), NOW(), NOW());
