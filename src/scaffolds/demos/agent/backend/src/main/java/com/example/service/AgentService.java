package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.AgentQuery;
import com.example.dto.AgentSaveDTO;
import com.example.dto.GraphDTO;
import com.example.entity.Agent;

import java.util.List;

/**
 * 智能体服务接口
 */
public interface AgentService extends IService<Agent> {

    /**
     * 分页查询（管理端，回填模型名与知识条目数）
     */
    IPage<Agent> pageQuery(AgentQuery query);

    /**
     * 前台可用的智能体列表，只出已发布的，按 sort 升序
     */
    List<Agent> listPublished();

    /**
     * 取智能体详情。onlyPublished 为 true 时草稿会被当作不存在，用于前台接口防偷看。
     */
    Agent getDetail(Long id, boolean onlyPublished);

    /**
     * 新增或更新基础信息（不动画布）
     */
    void saveOrUpdateAgent(AgentSaveDTO dto);

    /**
     * 保存画布。会先校验结构合法，不合法直接抛错不落库。
     */
    void saveGraph(Long id, GraphDTO graph);

    /**
     * 发布或撤回。publish 为 true 时会再校验一遍画布，避免把坏的编排放出去。
     */
    void publish(Long id, boolean publish);

    /**
     * 删除智能体，同时清掉它名下的知识条目与会话
     */
    void removeAgent(Long id);

    /**
     * 会话数加一
     */
    void increaseChatCount(Long id);

    /**
     * 把 graph_json 反序列化回 GraphDTO。执行引擎要用。
     */
    GraphDTO parseGraph(String graphJson);

    /**
     * 校验画布结构，不合法则抛 BusinessException
     */
    void validateGraph(GraphDTO graph);
}
