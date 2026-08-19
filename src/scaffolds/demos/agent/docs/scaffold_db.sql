-- ----------------------------------------------------------------------------
-- AI Agent 编排类毕业设计 Demo 数据库初始化脚本
-- 数据库：scaffold_db      字符集：utf8mb4      引擎：InnoDB
--
-- 在基础脚手架（user / notice / operation_log）之上，增加一套可视化编排模型：
--   模型配置 model_config → 智能体 agent（拖拽画布存在 graph_json 里）
--   → 会话 conversation → 消息 message（含节点执行轨迹）
--   → 知识库 knowledge（检索节点的数据源）
--
-- 画布没拆成节点表与连线表，而是直接存一字段 JSON：
-- Vue Flow 的 toObject() 导出就是 { nodes, edges }，存进去、读出来喂回去，
-- 两头各一行代码。拆表反而要写两套双向转换，不划算。
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
-- 模型配置表
-- 兼容 OpenAI 协议的任意服务：DeepSeek、通义、Kimi、本地 Ollama 都是填这张表。
-- api_key 明文入库仅为毕设演示，出口一律掩码成 sk-***abc，前端拿不到完整值。
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `model_config`;
CREATE TABLE `model_config` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT          COMMENT '主键ID',
  `name`        VARCHAR(100)  NOT NULL                         COMMENT '配置名称，如 DeepSeek 对话模型',
  `provider`    VARCHAR(50)   NOT NULL DEFAULT 'deepseek'      COMMENT '厂商标识：deepseek/openai/qwen/ollama/other',
  `base_url`    VARCHAR(255)  NOT NULL                         COMMENT '接口地址，如 https://api.deepseek.com',
  `api_key`     VARCHAR(255)  DEFAULT NULL                     COMMENT 'API Key（本地模型可为空）',
  `model`       VARCHAR(100)  NOT NULL                         COMMENT '模型名，如 deepseek-v4-flash',
  `temperature` DECIMAL(3, 2) NOT NULL DEFAULT 1.00            COMMENT '采样温度 0.00~2.00，越大越发散',
  `max_tokens`  INT           NOT NULL DEFAULT 2048            COMMENT '单次回复最大 token 数',
  `timeout`     INT           NOT NULL DEFAULT 60              COMMENT '请求超时（秒）',
  `status`      TINYINT       NOT NULL DEFAULT 1               COMMENT '状态：0-停用，1-启用',
  `is_default`  TINYINT       NOT NULL DEFAULT 0               COMMENT '是否默认：0-否，1-是（全局仅一条）',
  `remark`      VARCHAR(255)  DEFAULT NULL                     COMMENT '备注',
  `create_time` DATETIME      DEFAULT NULL                     COMMENT '创建时间',
  `update_time` DATETIME      DEFAULT NULL                     COMMENT '更新时间',
  `deleted`     TINYINT       NOT NULL DEFAULT 0               COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`, `deleted`),
  KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '模型配置表';

-- ----------------------------------------------------------------------------
-- 智能体表
-- status：0 草稿（前台不可见）↔ 1 已发布（前台列表里出现）。
--
-- graph_json 存整张画布：{ nodes: [...], edges: [...] }，
-- 直接是 Vue Flow toObject() 的结果，后端只校验结构合法不拆字段。
-- 节点形如：{ id, type, position: {x,y}, data: { title, ...参数 } }
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `agent`;
CREATE TABLE `agent` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT       COMMENT '主键ID',
  `name`            VARCHAR(100) NOT NULL                      COMMENT '智能体名称',
  `avatar`          VARCHAR(255) DEFAULT NULL                  COMMENT '头像URL',
  `description`     VARCHAR(500) DEFAULT NULL                  COMMENT '简介，前台卡片上展示',
  `greeting`        VARCHAR(500) DEFAULT NULL                  COMMENT '开场白，新建会话时作为第一条回复',
  `model_config_id` BIGINT       DEFAULT NULL                  COMMENT '默认模型配置ID（节点未单独指定时用它）',
  `graph_json`      JSON                                       COMMENT '画布结构：{ nodes: [...], edges: [...] }',
  `status`          TINYINT      NOT NULL DEFAULT 0            COMMENT '状态：0-草稿，1-已发布',
  `chat_count`      INT          NOT NULL DEFAULT 0            COMMENT '累计会话数',
  `sort`            INT          NOT NULL DEFAULT 0            COMMENT '前台排序值，越小越靠前',
  `create_time`     DATETIME     DEFAULT NULL                  COMMENT '创建时间',
  `update_time`     DATETIME     DEFAULT NULL                  COMMENT '更新时间',
  `publish_time`    DATETIME     DEFAULT NULL                  COMMENT '最近一次发布时间',
  `deleted`         TINYINT      NOT NULL DEFAULT 0            COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`, `deleted`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '智能体表';

-- ----------------------------------------------------------------------------
-- 知识库表
-- 检索节点的数据源。没用向量库，而是拿关键词与全文索引做召回，
-- 本科毕设的体量下够用，也不用额外部署 embedding 服务。
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `knowledge`;
CREATE TABLE `knowledge` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `agent_id`    BIGINT       DEFAULT NULL                      COMMENT '归属智能体ID，NULL 表示全局共享',
  `title`       VARCHAR(200) NOT NULL                          COMMENT '条目标题',
  `content`     TEXT         NOT NULL                          COMMENT '条目正文，命中后拼进提示词',
  `keywords`    VARCHAR(255) DEFAULT NULL                      COMMENT '关键词，逗号分隔，召回时优先匹配',
  `status`      TINYINT      NOT NULL DEFAULT 1                COMMENT '状态：0-停用，1-启用',
  `hit_count`   INT          NOT NULL DEFAULT 0                COMMENT '命中次数，方便看哪些条目有用',
  `create_time` DATETIME     DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT      NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_agent` (`agent_id`),
  KEY `idx_status` (`status`),
  FULLTEXT KEY `ft_content` (`title`, `content`) WITH PARSER ngram
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '知识库表';

-- ----------------------------------------------------------------------------
-- 会话表
-- 一个用户对一个智能体可以开多个会话，列表按 last_time 倒序。
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `conversation`;
CREATE TABLE `conversation` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT           COMMENT '主键ID',
  `user_id`     BIGINT       NOT NULL                          COMMENT '所属用户ID',
  `agent_id`    BIGINT       NOT NULL                          COMMENT '智能体ID',
  `title`       VARCHAR(100) DEFAULT NULL                      COMMENT '会话标题，默认取首句提问前 20 字',
  `msg_count`   INT          NOT NULL DEFAULT 0                COMMENT '消息条数',
  `last_time`   DATETIME     DEFAULT NULL                      COMMENT '最后一条消息时间，列表按它倒序',
  `create_time` DATETIME     DEFAULT NULL                      COMMENT '创建时间',
  `update_time` DATETIME     DEFAULT NULL                      COMMENT '更新时间',
  `deleted`     TINYINT      NOT NULL DEFAULT 0                COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`, `last_time`),
  KEY `idx_agent` (`agent_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '会话表';

-- ----------------------------------------------------------------------------
-- 消息表
-- node_trace 存本次回答走过哪些节点、每步耗时，
-- 前台可以展开看“推理过程”，调编排时也靠它定位哪一步出了问题。
-- 消息只追写不修改，不建逻辑删除列（删会话时级联物理删除）。
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
  `id`              BIGINT      NOT NULL AUTO_INCREMENT        COMMENT '主键ID',
  `conversation_id` BIGINT      NOT NULL                       COMMENT '所属会话ID',
  `role`            VARCHAR(20) NOT NULL                       COMMENT '角色：user-用户，assistant-智能体，system-系统',
  `content`         TEXT                                       COMMENT '消息内容',
  `node_trace`      JSON                                       COMMENT '执行轨迹：[{ nodeKey, nodeType, title, cost, output }]',
  `token_usage`     INT         DEFAULT NULL                   COMMENT '本条消耗的 token 数',
  `cost_ms`         BIGINT      DEFAULT NULL                   COMMENT '生成耗时（毫秒）',
  `error_msg`       VARCHAR(500) DEFAULT NULL                  COMMENT '失败原因，成功时为空',
  `create_time`     DATETIME    DEFAULT NULL                   COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation` (`conversation_id`, `id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '消息表';

-- ----------------------------------------------------------------------------
-- 初始化数据
-- 密码为明文，仅用于毕设演示
-- 下面的 INSERT 依赖自增主键顺序：user 1~3、model_config 1~2、agent 1~3
--
-- 场景取“租房咨询”：换个领域只需改知识库内容与提示词，
-- 编排结构与执行引擎一行不用改。
-- ----------------------------------------------------------------------------
INSERT INTO `user` (`username`, `password`, `nickname`, `age`, `gender`, `phone`, `email`, `role`, `create_time`, `update_time`) VALUES
('admin', '123456', '系统管理员', 28, 'male',   '13800000001', 'admin@example.com', 'admin', NOW(), NOW()),
('test',  '123456', '测试用户',   22, 'female', '13800000002', 'test@example.com',  'user',  NOW(), NOW()),
('zhang', '123456', '张三',       25, 'male',   '13800000003', 'zhang@example.com', 'user',  NOW(), NOW());

INSERT INTO `notice` (`title`, `content`, `create_by`, `create_time`, `update_time`) VALUES
('系统上线通知', '本系统已完成部署，欢迎使用。初始管理员账号 admin，密码 123456。', 'admin', NOW(), NOW()),
('如何配置智能体', '管理端「智能体管理」→「编排」可拖拽节点，保存后点发布，前台即可使用。', 'admin', NOW(), NOW()),
('模型密钥说明', '默认模型配置里的 API Key 为空，需到「模型配置」填入自己的密钥后才能对话。', 'admin', NOW(), NOW());

-- 模型配置：api_key 故意留空，拉代码的人自己填，避免密钥进仓库
-- base_url 只写到域名，/v1/chat/completions 由后端拼，换厂商只需改这两列
INSERT INTO `model_config` (`name`, `provider`, `base_url`, `api_key`, `model`, `temperature`, `max_tokens`, `timeout`, `status`, `is_default`, `remark`, `create_time`, `update_time`) VALUES
('DeepSeek 快速版', 'deepseek', 'https://api.deepseek.com', NULL, 'deepseek-v4-flash', 0.70, 2048, 60, 1, 1, '响应快、价格低，日常咨询够用', NOW(), NOW()),
('DeepSeek 专业版', 'deepseek', 'https://api.deepseek.com', NULL, 'deepseek-v4-pro',   0.70, 4096, 90, 1, 0, '推理能力更强，适合复杂合约分析', NOW(), NOW());

-- 智能体：1、2 已发布（前台可见），3 是草稿（前台不可见，用于验证发布开关）
-- graph_json 里的 id 就是 Vue Flow 的节点 id，data 里放该类型的参数：
--   llm：modelConfigId / systemPrompt / temperature / useHistory / historyLimit
--   knowledge：topK（召回条数）
-- 第一个智能体是完整链路：开始 → 检索知识库 → 大模型 → 结束
-- 第二个没挂检索节点，用来对比知识增强前后的回答差异
INSERT INTO `agent` (`name`, `description`, `greeting`, `model_config_id`, `graph_json`, `status`, `chat_count`, `sort`, `create_time`, `update_time`, `publish_time`) VALUES
('租房咨询顾问',
 '熟悉租房流程、押付规则与费用构成，会先查知识库再回答，尽量不编造。',
 '你好，我是租房咨询顾问。找房、看合约、算费用都可以问我，比如“押一付三是什么意思”。',
 1,
 '{"nodes":[{"id":"start_1","type":"start","position":{"x":60,"y":200},"data":{"title":"开始"}},{"id":"knowledge_1","type":"knowledge","position":{"x":300,"y":200},"data":{"title":"检索租房知识","topK":3}},{"id":"llm_1","type":"llm","position":{"x":560,"y":200},"data":{"title":"生成回答","modelConfigId":1,"systemPrompt":"你是一位资深租房顾问。回答要口语化、分条，每条不超两句。参考资料里有的就依据资料回答，没有就直说不确定，不要编造具体价格与法条。涉及金钱与签约时，提醒对方看房产证与书面合约。","temperature":0.7,"useHistory":true,"historyLimit":6}},{"id":"end_1","type":"end","position":{"x":820,"y":200},"data":{"title":"结束"}}],"edges":[{"id":"e_s1_k1","source":"start_1","target":"knowledge_1"},{"id":"e_k1_l1","source":"knowledge_1","target":"llm_1"},{"id":"e_l1_e1","source":"llm_1","target":"end_1"}]}',
 1, 2, 1, NOW(), NOW(), NOW()),
('合约条款解读',
 '把租房合约里的条款翻译成大白话，指出容易吃亏的地方。没挂知识库，全靠模型。',
 '把合约条款粘给我，我帮你逐条拆解，并指出需要警惕的地方。',
 2,
 '{"nodes":[{"id":"start_1","type":"start","position":{"x":80,"y":180},"data":{"title":"开始"}},{"id":"llm_1","type":"llm","position":{"x":380,"y":180},"data":{"title":"条款分析","modelConfigId":2,"systemPrompt":"你是熟悉房屋租赁的法务助手。用户贴出条款后，先用一句话说明这条到底约定了什么，再指出对租客是否不利。不要自称律师，结尾提醒重大争议应咨询专业人士。","temperature":0.3,"useHistory":true,"historyLimit":4}},{"id":"end_1","type":"end","position":{"x":680,"y":180},"data":{"title":"结束"}}],"edges":[{"id":"e_s1_l1","source":"start_1","target":"llm_1"},{"id":"e_l1_e1","source":"llm_1","target":"end_1"}]}',
 1, 0, 2, NOW(), NOW(), NOW()),
('周边配套向导',
 '还在搭的草稿，用来验证未发布的智能体不会出现在前台。',
 '想了解哪个小区的周边配套？',
 1,
 '{"nodes":[{"id":"start_1","type":"start","position":{"x":100,"y":160},"data":{"title":"开始"}},{"id":"llm_1","type":"llm","position":{"x":400,"y":160},"data":{"title":"配套介绍","modelConfigId":1,"systemPrompt":"你熟悉城市生活配套，介绍时分交通、购物、医疗、教育四个方面。","temperature":0.8,"useHistory":false,"historyLimit":0}}],"edges":[{"id":"e_s1_l1","source":"start_1","target":"llm_1"}]}',
 0, 0, 3, NOW(), NOW(), NULL);

-- 知识库：agent_id = 1 的只给租房顾问用，NULL 的全局共享
-- 最后一条停用，用来验证检索时会过滤掉 status = 0 的条目
INSERT INTO `knowledge` (`agent_id`, `title`, `content`, `keywords`, `status`, `hit_count`, `create_time`, `update_time`) VALUES
(1, '押付方式怎么看',
 '押一付三指交一个月房租作押金，同时一次性付三个月房租。押一付一则是交一个月押金加一个月房租，资金压力小但月租可能略高。押金在退租且房屋无损坏时应当退回，合约里要写清退押时间。',
 '押金,押一付三,押一付一,付款方式,退押', 1, 5, NOW(), NOW()),
(1, '中介费一般收多少',
 '通过中介签约常见的是一个月房租的 50% 到 100%，具体看城市与门店。费用应当在签约前谈定并写进合约，口头承诺不作数。直租业主的房子没有这笔费用。',
 '中介费,服务费,佣金,直租', 1, 3, NOW(), NOW()),
(1, '水电网与物业费归谁',
 '通常水电燃气与宽带由租客按实际使用量承担，物业费与供暖费多数由业主承担，但各地习惯不同。入住前建议拍下水表电表燃气表的读数并写进交接单，退租时就不会扯不清。',
 '水电费,物业费,供暖费,宽带,仪表读数', 1, 4, NOW(), NOW()),
(1, '看房时要确认什么',
 '一是看房产证与业主身份证是否一致，二是试水压、热水器与空调，三是问清周边晚上吹不吹、隔音如何，四是确认消防通道与门禁。转租房要额外看原合约是否允许转租。',
 '看房,房产证,验房,转租,注意事项', 1, 6, NOW(), NOW()),
(1, '提前退租怎么处理',
 '多数合约约定提前退租需提前 30 天告知，否则可能扣一个月房租作为违约金。若能找到接手租客并经业主同意，往往可以减免。签约前就要看清这一条。',
 '退租,违约金,提前退租,转租', 1, 2, NOW(), NOW()),
(NULL, '平台使用说明',
 '前台可以选择多个智能体分别开会话，历史会话在左侧列表里。每次回答可以展开看执行轨迹，了解走了哪些节点。',
 '使用说明,怎么用,帮助', 1, 1, NOW(), NOW()),
(1, '待补充的房源行情',
 '这条已停用，用来验证检索不会召回停用条目。',
 '行情,房价', 0, 0, NOW(), NOW());

-- 会话与消息：给 test 预置两段对话，进去就能看到东西，不用自己造
INSERT INTO `conversation` (`user_id`, `agent_id`, `title`, `msg_count`, `last_time`, `create_time`, `update_time`) VALUES
(2, 1, '押一付三是什么意思', 4, NOW(), NOW(), NOW()),
(2, 2, '这条违约金条款合理吗', 2, NOW(), NOW(), NOW());

-- node_trace 展示了一次完整链路的耗时分布，前台可展开查看
INSERT INTO `message` (`conversation_id`, `role`, `content`, `node_trace`, `token_usage`, `cost_ms`, `create_time`) VALUES
(1, 'assistant', '你好，我是租房咨询顾问。找房、看合约、算费用都可以问我，比如“押一付三是什么意思”。', NULL, NULL, NULL, NOW()),
(1, 'user', '押一付三是什么意思？和押一付一比哪个划算？', NULL, NULL, NULL, NOW()),
(1, 'assistant',
 '押一付三是交一个月房租当押金，再一次性付三个月租金，签约时要拿四个月的钱。\n押一付一只需拿两个月的钱，压力小很多，但房东常会把月租抬高一些。\n手头宽裕且打算住满一年，押一付三总价更低；如果工作变动大，押一付一更灵活。\n不管选哪种，退押条件都要写进合约。',
 '[{"nodeKey":"start_1","nodeType":"start","title":"开始","cost":1},{"nodeKey":"knowledge_1","nodeType":"knowledge","title":"检索租房知识","cost":18,"output":"命中 2 条：押付方式怎么看、提前退租怎么处理"},{"nodeKey":"llm_1","nodeType":"llm","title":"生成回答","cost":2140,"output":"已生成 132 字"},{"nodeKey":"end_1","nodeType":"end","title":"结束","cost":0}]',
 386, 2159, NOW()),
(2, 'assistant', '把合约条款粘给我，我帮你逐条拆解，并指出需要警惕的地方。', NULL, NULL, NULL, NOW()),
(2, 'user', '合约写着“租客提前退租，押金不退”，这条合理吗？', NULL, NULL, NULL, NOW());
