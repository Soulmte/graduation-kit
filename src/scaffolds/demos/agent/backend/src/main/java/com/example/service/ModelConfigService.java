package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.ModelConfigDTO;
import com.example.dto.ModelConfigQuery;
import com.example.entity.ModelConfig;

import java.util.List;

/**
 * 模型配置服务接口
 *
 * 所有对外返回的 ModelConfig 都经过掩码，apiKey 只剩 sk-***abc 的形态。
 * 需要真实 Key 的只有 LlmClient，走 getRaw 单独取。
 */
public interface ModelConfigService extends IService<ModelConfig> {

    /**
     * 分页查询（apiKey 已掩码）
     */
    IPage<ModelConfig> pageQuery(ModelConfigQuery query);

    /**
     * 启用中的配置列表，给编排页的模型下拉框用（apiKey 已掩码）
     */
    List<ModelConfig> listEnabled();

    /**
     * 取原始配置，apiKey 是明文。仅供服务端内部调用，不要直接返回给前端。
     */
    ModelConfig getRaw(Long id);

    /**
     * 取默认配置的原始值，没设默认则返回 null
     */
    ModelConfig getDefaultRaw();

    /**
     * 新增或更新。apiKey 留空表示沿用原值。
     */
    void saveOrUpdateConfig(ModelConfigDTO dto);

    /**
     * 删除。已被智能体引用时不允许删。
     */
    void removeConfig(Long id);

    /**
     * 设为默认，同时把其他配置的默认标记清掉
     */
    void setDefault(Long id);
}
