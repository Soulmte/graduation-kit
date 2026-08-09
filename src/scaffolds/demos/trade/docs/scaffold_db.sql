-- ----------------------------------------------------------------------------
-- 交易类毕业设计 Demo 数据库初始化脚本
-- 数据库：scaffold_db      字符集：utf8mb4      引擎：InnoDB
--
-- 在基础脚手架（user / notice / operation_log）之上，增加一套通用交易模型：
--   商家 merchant → 分类 category → 商品 product
--   购物车 cart_item → 订单 orders + 订单快照 order_item
--   支付流水 payment → 退款申请 refund
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
  `role`        VARCHAR(20)  NOT NULL DEFAULT 'user'           COMMENT '角色：admin-管理员，merchant-商家，user-普通用户',
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
-- 商家表
-- 一个用户最多开一个店，user_id 唯一。审核通过后才能上商品
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `merchant`;
CREATE TABLE `merchant` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT         COMMENT '主键ID',
  `user_id`       BIGINT       NOT NULL                        COMMENT '所属用户ID（逻辑关联 user.id）',
  `shop_name`     VARCHAR(100) NOT NULL                        COMMENT '店铺名称',
  `logo`          VARCHAR(255) DEFAULT NULL                    COMMENT '店铺头像URL',
  `description`   VARCHAR(500) DEFAULT NULL                    COMMENT '店铺简介',
  `contact_phone` VARCHAR(20)  DEFAULT NULL                    COMMENT '联系电话',
  `status`        TINYINT      NOT NULL DEFAULT 0              COMMENT '状态：0-待审核，1-正常，2-已封禁',
  `create_time`   DATETIME     DEFAULT NULL                    COMMENT '创建时间',
  `update_time`   DATETIME     DEFAULT NULL                    COMMENT '更新时间',
  `deleted`       TINYINT      NOT NULL DEFAULT 0              COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`, `deleted`),
  KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商家表';

-- ----------------------------------------------------------------------------
-- 商品分类表
-- 平铺单层分类，管理员维护。需要多级分类可自行加 parent_id
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `name`        VARCHAR(50) NOT NULL                          COMMENT '分类名称',
  `sort`        INT         NOT NULL DEFAULT 0                COMMENT '排序值，越小越靠前',
  `create_time` DATETIME    DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME    DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT     NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`, `deleted`),
  KEY `idx_sort` (`sort`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商品分类表';

-- ----------------------------------------------------------------------------
-- 商品表
-- stock 与 sales 分开存，下单扣库存、支付后加销量
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id`          BIGINT         NOT NULL AUTO_INCREMENT        COMMENT '主键ID',
  `merchant_id` BIGINT         NOT NULL                       COMMENT '所属商家ID',
  `category_id` BIGINT         DEFAULT NULL                   COMMENT '分类ID',
  `name`        VARCHAR(200)   NOT NULL                       COMMENT '商品名称',
  `cover`       VARCHAR(255)   DEFAULT NULL                   COMMENT '封面图URL',
  `description` TEXT                                          COMMENT '商品详情（富文本）',
  `price`       DECIMAL(10, 2) NOT NULL DEFAULT 0.00          COMMENT '单价（元）',
  `stock`       INT            NOT NULL DEFAULT 0             COMMENT '库存',
  `sales`       INT            NOT NULL DEFAULT 0             COMMENT '累计销量',
  `status`      TINYINT        NOT NULL DEFAULT 0             COMMENT '状态：0-下架，1-上架',
  `create_time` DATETIME       DEFAULT NULL                   COMMENT '创建时间',
  `update_time` DATETIME       DEFAULT NULL                   COMMENT '更新时间',
  `deleted`     TINYINT        NOT NULL DEFAULT 0             COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商品表';

-- ----------------------------------------------------------------------------
-- 购物车表
-- 同一用户同一商品只保留一条，重复加车叠加数量
-- 不存价格：购物车展示实时读商品表，以免价格变动后对不上
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cart_item`;
CREATE TABLE `cart_item` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT              COMMENT '主键ID',
  `user_id`     BIGINT   NOT NULL                             COMMENT '用户ID',
  `product_id`  BIGINT   NOT NULL                             COMMENT '商品ID',
  `quantity`    INT      NOT NULL DEFAULT 1                   COMMENT '数量',
  `create_time` DATETIME DEFAULT NULL                         COMMENT '创建时间',
  `update_time` DATETIME DEFAULT NULL                         COMMENT '更新时间',
  `deleted`     TINYINT  NOT NULL DEFAULT 0                   COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`, `deleted`),
  KEY `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '购物车表';

-- ----------------------------------------------------------------------------
-- 订单表
-- 表名用 orders 而不是 order，order 是 MySQL 保留字
--
-- 状态流转（status）：
--   0 待支付 --支付--> 1 待发货 --商家发货--> 2 待收货 --买家确认--> 3 已完成
--   0 待支付 --买家/超时取消--> 4 已取消
--   1/2 --申请退款--> 5 退款中 --商家同意--> 6 已退款
--                        └--商家拒绝--> 回到原状态
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`             BIGINT         NOT NULL AUTO_INCREMENT     COMMENT '主键ID',
  `order_no`       VARCHAR(32)    NOT NULL                    COMMENT '订单号（展示与搜索用）',
  `user_id`        BIGINT         NOT NULL                    COMMENT '下单用户ID',
  `merchant_id`    BIGINT         NOT NULL                    COMMENT '商家ID（一单只属一家，购物车跨店时拆单）',
  `total_amount`   DECIMAL(10, 2) NOT NULL DEFAULT 0.00       COMMENT '订单总金额（元）',
  `status`         TINYINT        NOT NULL DEFAULT 0          COMMENT '状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-已退款',
  `receiver_name`  VARCHAR(50)    DEFAULT NULL                COMMENT '收货人姓名',
  `receiver_phone` VARCHAR(20)    DEFAULT NULL                COMMENT '收货人电话',
  `receiver_addr`  VARCHAR(255)   DEFAULT NULL                COMMENT '收货地址',
  `remark`         VARCHAR(255)   DEFAULT NULL                COMMENT '买家备注',
  `pay_time`       DATETIME       DEFAULT NULL                COMMENT '支付时间',
  `ship_time`      DATETIME       DEFAULT NULL                COMMENT '发货时间',
  `finish_time`    DATETIME       DEFAULT NULL                COMMENT '完成时间',
  `cancel_time`    DATETIME       DEFAULT NULL                COMMENT '取消时间',
  `create_time`    DATETIME       DEFAULT NULL                COMMENT '创建时间',
  `update_time`    DATETIME       DEFAULT NULL                COMMENT '更新时间',
  `deleted`        TINYINT        NOT NULL DEFAULT 0          COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '订单表';

-- ----------------------------------------------------------------------------
-- 订单明细表
-- 故意冗余商品名、封面、单价：订单是历史凭证，商品改名改价后旧订单不能跟着变
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
  `id`            BIGINT         NOT NULL AUTO_INCREMENT      COMMENT '主键ID',
  `order_id`      BIGINT         NOT NULL                     COMMENT '订单ID',
  `product_id`    BIGINT         NOT NULL                     COMMENT '商品ID',
  `product_name`  VARCHAR(200)   NOT NULL                     COMMENT '下单时的商品名称（快照）',
  `product_cover` VARCHAR(255)   DEFAULT NULL                 COMMENT '下单时的封面图（快照）',
  `price`         DECIMAL(10, 2) NOT NULL DEFAULT 0.00        COMMENT '下单时的单价（快照）',
  `quantity`      INT            NOT NULL DEFAULT 1           COMMENT '购买数量',
  `subtotal`      DECIMAL(10, 2) NOT NULL DEFAULT 0.00        COMMENT '小计 = price * quantity',
  `create_time`   DATETIME       DEFAULT NULL                 COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_product` (`product_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '订单明细表';

-- ----------------------------------------------------------------------------
-- 支付流水表
-- 模拟支付：不接真实渠道，但保留流水记录，方便论文里讲清支付链路
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
  `id`          BIGINT         NOT NULL AUTO_INCREMENT        COMMENT '主键ID',
  `pay_no`      VARCHAR(32)    NOT NULL                       COMMENT '支付流水号',
  `order_id`    BIGINT         NOT NULL                       COMMENT '订单ID',
  `user_id`     BIGINT         NOT NULL                       COMMENT '付款用户ID',
  `amount`      DECIMAL(10, 2) NOT NULL DEFAULT 0.00          COMMENT '支付金额（元）',
  `method`      VARCHAR(20)    NOT NULL DEFAULT 'mock'        COMMENT '支付方式：mock/alipay/wechat',
  `status`      TINYINT        NOT NULL DEFAULT 0             COMMENT '状态：0-待支付，1-成功，2-失败',
  `pay_time`    DATETIME       DEFAULT NULL                   COMMENT '支付完成时间',
  `create_time` DATETIME       DEFAULT NULL                   COMMENT '创建时间',
  `update_time` DATETIME       DEFAULT NULL                   COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pay_no` (`pay_no`),
  KEY `idx_order` (`order_id`),
  KEY `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '支付流水表';

-- ----------------------------------------------------------------------------
-- 退款申请表
-- 一单可多次申请（被拒后可重提），所以不做 order_id 唯一
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `refund`;
CREATE TABLE `refund` (
  `id`           BIGINT         NOT NULL AUTO_INCREMENT       COMMENT '主键ID',
  `refund_no`    VARCHAR(32)    NOT NULL                      COMMENT '退款单号',
  `order_id`     BIGINT         NOT NULL                      COMMENT '订单ID',
  `user_id`      BIGINT         NOT NULL                      COMMENT '申请用户ID',
  `amount`       DECIMAL(10, 2) NOT NULL DEFAULT 0.00         COMMENT '退款金额（元）',
  `reason`       VARCHAR(255)   DEFAULT NULL                  COMMENT '退款理由',
  `status`       TINYINT        NOT NULL DEFAULT 0            COMMENT '状态：0-待审核，1-已同意，2-已拒绝',
  `audit_by`     VARCHAR(50)    DEFAULT NULL                  COMMENT '审核人用户名',
  `audit_remark` VARCHAR(255)   DEFAULT NULL                  COMMENT '审核备注',
  `audit_time`   DATETIME       DEFAULT NULL                  COMMENT '审核时间',
  `create_time`  DATETIME       DEFAULT NULL                  COMMENT '创建时间',
  `update_time`  DATETIME       DEFAULT NULL                  COMMENT '更新时间',
  `deleted`      TINYINT        NOT NULL DEFAULT 0            COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_no` (`refund_no`),
  KEY `idx_order` (`order_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '退款申请表';

-- ----------------------------------------------------------------------------
-- 初始化数据
-- 密码为明文，仅用于毕设演示
-- 下面的 INSERT 依赖自增主键顺序：user 1~5、merchant 1~2、category 1~4、product 1~6
-- ----------------------------------------------------------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `age`, `gender`, `phone`, `email`, `role`, `create_time`, `update_time`) VALUES
('admin', '123456', '系统管理员', 28, 'male',   '13800000001', 'admin@example.com', 'admin',    NOW(), NOW()),
('test',  '123456', '测试用户',   22, 'female', '13800000002', 'test@example.com',  'user',     NOW(), NOW()),
('zhang', '123456', '张三',       25, 'male',   '13800000003', 'zhang@example.com', 'user',     NOW(), NOW()),
('shop1', '123456', '青山茶行',   35, 'male',   '13800000004', 'shop1@example.com', 'merchant', NOW(), NOW()),
('shop2', '123456', '晚风书店',   30, 'female', '13800000005', 'shop2@example.com', 'merchant', NOW(), NOW());

INSERT INTO `notice` (`title`, `content`, `create_by`, `create_time`, `update_time`) VALUES
('系统上线通知', '本系统已完成部署，欢迎使用。初始管理员账号 admin，密码 123456。', 'admin', NOW(), NOW()),
('商家入驻说明',   '普通用户在个人中心可申请开店，管理员审核通过后即可上传商品。',     'admin', NOW(), NOW());

-- 商家：shop1 已过审（status=1），shop2 待审核（status=0），方便演示审核流程
INSERT INTO `merchant` (`user_id`, `shop_name`, `description`, `contact_phone`, `status`, `create_time`, `update_time`) VALUES
(4, '青山茶行', '主营绿茶、红茶与茶具，产地直供。', '13800000004', 1, NOW(), NOW()),
(5, '晚风书店', '文学、计算机与设计类图书。',       '13800000005', 0, NOW(), NOW());

INSERT INTO `category` (`name`, `sort`, `create_time`, `update_time`) VALUES
('茶叶',   1, NOW(), NOW()),
('茶具',   2, NOW(), NOW()),
('图书',   3, NOW(), NOW()),
('数码',   4, NOW(), NOW());

-- 商品：1~4 属 shop1（已上架），5 下架，6 零库存，用于验证下单校验
INSERT INTO `product` (`merchant_id`, `category_id`, `name`, `description`, `price`, `stock`, `sales`, `status`, `create_time`, `update_time`) VALUES
(1, 1, '明前龙井 250g',   '<p>明前头采，栗香浓郁，礼品盒装。</p>',       168.00, 100, 12, 1, NOW(), NOW()),
(1, 1, '陈年熟普 200g',    '<p>云南大叶种滋味，适合日常口粮。</p>',       88.00,  200, 30, 1, NOW(), NOW()),
(1, 2, '白瓷盖碗 120ml',   '<p>景德镇白瓷，手感轻薄，不烫手。</p>',       45.00,  50,  8,  1, NOW(), NOW()),
(1, 2, '粗陶茶盘套装',     '<p>含茶盘、茶夹、茶则三件套。</p>',           239.00, 20,  3,  1, NOW(), NOW()),
(1, 4, '智能温控电热壶',   '<p>五档温控，保温两小时。此商品已下架。</p>', 329.00, 15,  0,  0, NOW(), NOW()),
(1, 1, '陈年祁门红 100g',  '<p>限量库存已售完，用于演示零库存。</p>',     520.00, 0,   46, 1, NOW(), NOW());

-- 购物车：test 用户预放两件，登录后直接能看到结算页
INSERT INTO `cart_item` (`user_id`, `product_id`, `quantity`, `create_time`, `update_time`) VALUES
(2, 1, 2, NOW(), NOW()),
(2, 3, 1, NOW(), NOW());

-- 订单：覆盖待支付、待发货、待收货、已完成、退款中五种状态
INSERT INTO `orders` (`order_no`, `user_id`, `merchant_id`, `total_amount`, `status`, `receiver_name`, `receiver_phone`, `receiver_addr`, `remark`, `pay_time`, `ship_time`, `finish_time`, `create_time`, `update_time`) VALUES
('202401010001', 2, 1, 336.00, 0, '测试用户', '13800000002', '杭州市西湖区文一路 100 号', '尽快发货', NULL,  NULL,  NULL,  NOW(), NOW()),
('202401010002', 2, 1, 88.00,  1, '测试用户', '13800000002', '杭州市西湖区文一路 100 号', NULL,       NOW(), NULL,  NULL,  NOW(), NOW()),
('202401010003', 2, 1, 45.00,  2, '测试用户', '13800000002', '杭州市西湖区文一路 100 号', NULL,       NOW(), NOW(), NULL,  NOW(), NOW()),
('202401010004', 3, 1, 239.00, 3, '张三',     '13800000003', '南京市玄武区中山路 5 号',   NULL,       NOW(), NOW(), NOW(), NOW(), NOW()),
('202401010005', 3, 1, 168.00, 5, '张三',     '13800000003', '南京市玄武区中山路 5 号',   NULL,       NOW(), NOW(), NULL,  NOW(), NOW());

INSERT INTO `order_item` (`order_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`, `create_time`) VALUES
(1, 1, '明前龙井 250g',  168.00, 2, 336.00, NOW()),
(2, 2, '陈年熟普 200g',   88.00,  1, 88.00,  NOW()),
(3, 3, '白瓷盖碗 120ml',  45.00,  1, 45.00,  NOW()),
(4, 4, '粗陶茶盘套装',    239.00, 1, 239.00, NOW()),
(5, 1, '明前龙井 250g',  168.00, 1, 168.00, NOW());

INSERT INTO `payment` (`pay_no`, `order_id`, `user_id`, `amount`, `method`, `status`, `pay_time`, `create_time`, `update_time`) VALUES
('PAY202401010002', 2, 2, 88.00,  'mock', 1, NOW(), NOW(), NOW()),
('PAY202401010003', 3, 2, 45.00,  'mock', 1, NOW(), NOW(), NOW()),
('PAY202401010004', 4, 3, 239.00, 'mock', 1, NOW(), NOW(), NOW()),
('PAY202401010005', 5, 3, 168.00, 'mock', 1, NOW(), NOW(), NOW());

-- 待商家审核的退款申请，对应上面那笔 status=5 的订单
INSERT INTO `refund` (`refund_no`, `order_id`, `user_id`, `amount`, `reason`, `status`, `create_time`, `update_time`) VALUES
('RF202401010005', 5, 3, 168.00, '买重了，申请退款', 0, NOW(), NOW());
