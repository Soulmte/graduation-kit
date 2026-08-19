package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.KnowledgeDTO;
import com.example.dto.KnowledgeQuery;
import com.example.entity.Knowledge;

import java.util.List;

/**
 * 知识库服务接口
 */
public interface KnowledgeService extends IService<Knowledge> {

    /**
     * 分页查询（回填所属智能体名称）
     */
    IPage<Knowledge> pageQuery(KnowledgeQuery query);

    /**
     * 新增或更新
     */
    void saveOrUpdateKnowledge(KnowledgeDTO dto);

    /**
     * 检索：给定问题召回最相关的若干条，并把命中条目的 hitCount 加一。
     *
     * 召回范围是「该智能体自己的条目 + 全局条目」，只取启用中的。
     *
     * @param agentId  智能体ID
     * @param question 用户提问
     * @param topK     最多返回几条，兜底为 3
     */
    List<Knowledge> retrieve(Long agentId, String question, Integer topK);
}
