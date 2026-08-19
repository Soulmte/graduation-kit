package com.example.service.datasource;

import java.util.List;
import java.util.Map;

/**
 * 数据源提供者 —— 给「查数据」节点用的扩展点。
 *
 * <p>这是整个引擎唯一为「接自己的业务表」预留的口子。知识库检索走的是
 * knowledge 表，只能放事先录好的文档；而毕设里更常见的诉求是让智能体
 * 去查项目自己的业务表（房源、商品、课程、工单、库存……），拿到实时数据
 * 再交给模型组织语言。
 *
 * <h3>怎么接自己的表</h3>
 * <ol>
 *   <li>新建一个类实现本接口，打上 {@code @Component}</li>
 *   <li>{@link #key()} 返回一个英文标识，如 {@code house}</li>
 *   <li>{@link #query(Map, String)} 里写你的查询，把结果拼成人话返回</li>
 * </ol>
 *
 * Spring 会自动把所有实现收集进 {@code Map<String, DataSourceProvider>}，
 * 管理端下拉框、画布节点、执行引擎全都自动认识它，不用改任何既有代码。
 *
 * <h3>返回值为什么是文本而不是对象</h3>
 * 下游是大模型，最终都要变成提示词里的字符。在这里就拼成人类可读的文本，
 * 比返回 List&lt;实体&gt; 再让引擎去猜怎么序列化更省事，也让开发者能精确控制
 * 「模型看到什么」——这恰恰是回答质量的关键。
 *
 * @see NoticeDataSource 一个能直接跑的示例实现
 */
public interface DataSourceProvider {

    /**
     * 数据源唯一标识，存进 graph_json 的 {@code data.source} 字段。
     * 用小写英文，如 house、goods、course。
     */
    String key();

    /**
     * 管理端下拉框里显示的名字，如「公告库」。
     */
    String label();

    /**
     * 一句话说明这个数据源能查到什么，显示在下拉框选项下方，
     * 帮配置的人（可能不是你）搞清楚该选哪个。
     */
    String description();

    /**
     * 声明这个数据源支持哪些筛选参数。
     *
     * <p>管理端会按这份声明自动渲染表单控件，所以加一个筛选条件
     * 不用动前端代码。返回空列表表示没有可配的参数。
     */
    default List<ParamSpec> params() {
        return List.of();
    }

    /**
     * 执行查询。
     *
     * @param params   画布上配好的筛选参数，键与 {@link #params()} 声明的 name 对应。
     *                 值来自 JSON，可能是 String/Integer/Boolean，取值时注意兼容。
     * @param question 用户本次的提问原文。想做「从问题里抽关键词再查」可以用它。
     * @return 查询结果的文本形式，会拼进提示词交给模型。
     *         查不到东西时返回空字符串或 null，引擎会照实告诉模型「没查到」，
     *         不要在这里编造内容。
     */
    String query(Map<String, Object> params, String question);

    /**
     * 参数声明。管理端据此渲染控件，后端据此校验。
     *
     * @param name  参数名，对应 graph_json 里 data.params 的键
     * @param label 表单上的中文标签
     * @param type  控件类型：text 文本框 / number 数字 / select 下拉 / switch 开关
     * @param options select 类型的可选项，其余类型给 null
     * @param extra  表单项下方的灰色提示，说明这个参数怎么影响结果
     */
    record ParamSpec(String name, String label, String type,
                     List<Option> options, String extra) {

        /** 文本参数 */
        public static ParamSpec text(String name, String label, String extra) {
            return new ParamSpec(name, label, "text", null, extra);
        }

        /** 数字参数 */
        public static ParamSpec number(String name, String label, String extra) {
            return new ParamSpec(name, label, "number", null, extra);
        }

        /** 下拉参数 */
        public static ParamSpec select(String name, String label, List<Option> options, String extra) {
            return new ParamSpec(name, label, "select", options, extra);
        }

        /** 开关参数 */
        public static ParamSpec bool(String name, String label, String extra) {
            return new ParamSpec(name, label, "switch", null, extra);
        }
    }

    /**
     * 下拉选项
     *
     * @param value 存进 graph_json 的值
     * @param label 界面上显示的文字
     */
    record Option(String value, String label) {
    }
}
