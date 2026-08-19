package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.exception.BusinessException;
import com.example.common.result.ResultCode;
import com.example.dto.ModelConfigDTO;
import com.example.dto.ModelConfigQuery;
import com.example.entity.Agent;
import com.example.entity.ModelConfig;
import com.example.mapper.AgentMapper;
import com.example.mapper.ModelConfigMapper;
import com.example.service.ModelConfigService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 模型配置服务实现
 */
@Service
public class ModelConfigServiceImpl extends ServiceImpl<ModelConfigMapper, ModelConfig>
        implements ModelConfigService {

    private final AgentMapper agentMapper;

    public ModelConfigServiceImpl(AgentMapper agentMapper) {
        this.agentMapper = agentMapper;
    }

    @Override
    public IPage<ModelConfig> pageQuery(ModelConfigQuery query) {
        Page<ModelConfig> page = new Page<>(query.getPageNum(), query.getPageSize());

        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getName())) {
            wrapper.like(ModelConfig::getName, query.getName());
        }
        if (StringUtils.hasText(query.getProvider())) {
            wrapper.eq(ModelConfig::getProvider, query.getProvider());
        }
        if (query.getStatus() != null) {
            wrapper.eq(ModelConfig::getStatus, query.getStatus());
        }

        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "name" -> wrapper.orderBy(true, isAsc, ModelConfig::getName);
                case "createTime" -> wrapper.orderBy(true, isAsc, ModelConfig::getCreateTime);
                default -> defaultOrder(wrapper);
            }
        } else {
            defaultOrder(wrapper);
        }

        IPage<ModelConfig> result = this.page(page, wrapper);
        result.getRecords().forEach(this::mask);
        return result;
    }

    @Override
    public List<ModelConfig> listEnabled() {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getStatus, ModelConfig.STATUS_ON);
        defaultOrder(wrapper);

        List<ModelConfig> list = this.list(wrapper);
        list.forEach(this::mask);
        return list;
    }

    @Override
    public ModelConfig getRaw(Long id) {
        ModelConfig config = this.getById(id);
        if (config == null) {
            throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
        }
        return config;
    }

    @Override
    public ModelConfig getDefaultRaw() {
        LambdaQueryWrapper<ModelConfig> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModelConfig::getIsDefault, ModelConfig.DEFAULT_YES)
                .eq(ModelConfig::getStatus, ModelConfig.STATUS_ON)
                .orderByAsc(ModelConfig::getId)
                .last("LIMIT 1");
        return this.getOne(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveOrUpdateConfig(ModelConfigDTO dto) {
        // 名称不能重（库里有 uk_name 兜底，这里先查一遍是为了报中文提示）
        LambdaQueryWrapper<ModelConfig> dup = new LambdaQueryWrapper<>();
        dup.eq(ModelConfig::getName, dto.getName());
        if (dto.getId() != null) {
            dup.ne(ModelConfig::getId, dto.getId());
        }
        if (this.count(dup) > 0) {
            throw new BusinessException("已经有叫【" + dto.getName() + "】的配置了，换个名字");
        }

        ModelConfig config = new ModelConfig();
        BeanUtils.copyProperties(dto, config);

        if (dto.getId() == null) {
            // 新增
            this.save(config);
        } else {
            ModelConfig old = this.getById(dto.getId());
            if (old == null) {
                throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
            }
            // 前端拿到的是掩码值，留空就意味着“别动原来的 Key”
            if (!StringUtils.hasText(dto.getApiKey())) {
                config.setApiKey(old.getApiKey());
            }
            this.updateById(config);
        }

        // 设为默认时把其他条降下来，保证全局只有一个默认
        if (config.getIsDefault() != null && config.getIsDefault() == ModelConfig.DEFAULT_YES) {
            clearOtherDefault(config.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeConfig(Long id) {
        ModelConfig config = this.getById(id);
        if (config == null) {
            throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
        }

        // 被智能体引用着就不让删，否则对话时才发现模型没了
        LambdaQueryWrapper<Agent> used = new LambdaQueryWrapper<>();
        used.eq(Agent::getModelConfigId, id);
        Long count = agentMapper.selectCount(used);
        if (count != null && count > 0) {
            throw new BusinessException("还有 " + count + " 个智能体在用这个模型，先换掉再删");
        }

        this.removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void setDefault(Long id) {
        ModelConfig config = this.getById(id);
        if (config == null) {
            throw new BusinessException(ResultCode.MODEL_NOT_EXIST);
        }
        if (config.getStatus() != null && config.getStatus() == ModelConfig.STATUS_OFF) {
            throw new BusinessException("停用的配置不能设为默认，先启用它");
        }

        clearOtherDefault(id);

        LambdaUpdateWrapper<ModelConfig> set = new LambdaUpdateWrapper<>();
        set.eq(ModelConfig::getId, id).set(ModelConfig::getIsDefault, ModelConfig.DEFAULT_YES);
        this.update(set);
    }

    /**
     * 默认排序：默认项置顶，其余按创建时间倒序
     */
    private void defaultOrder(LambdaQueryWrapper<ModelConfig> wrapper) {
        wrapper.orderByDesc(ModelConfig::getIsDefault).orderByDesc(ModelConfig::getCreateTime);
    }

    /**
     * 把除 keepId 以外的默认标记清掉
     */
    private void clearOtherDefault(Long keepId) {
        LambdaUpdateWrapper<ModelConfig> clear = new LambdaUpdateWrapper<>();
        clear.ne(ModelConfig::getId, keepId)
                .eq(ModelConfig::getIsDefault, ModelConfig.DEFAULT_YES)
                .set(ModelConfig::getIsDefault, ModelConfig.DEFAULT_NO);
        this.update(clear);
    }

    /**
     * 把 apiKey 掩成 sk-***abc：留头四尾三，中间一律星号。
     * 既能让管理员认出是哪个 Key，又不至于泄露。
     * 另外给 keyConfigured 标记，前端靠它判断“未配置”还是“已配置”。
     */
    private void mask(ModelConfig config) {
        String key = config.getApiKey();
        boolean configured = StringUtils.hasText(key);
        config.setKeyConfigured(configured);

        if (!configured) {
            config.setApiKey(null);
            return;
        }
        String trimmed = key.trim();
        if (trimmed.length() <= 7) {
            config.setApiKey("***");
            return;
        }
        config.setApiKey(trimmed.substring(0, 4) + "***" + trimmed.substring(trimmed.length() - 3));
    }
}
