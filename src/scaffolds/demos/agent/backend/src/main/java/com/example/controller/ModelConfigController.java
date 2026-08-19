package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.ModelConfigDTO;
import com.example.dto.ModelConfigQuery;
import com.example.entity.ModelConfig;
import com.example.service.ModelConfigService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 模型配置控制器
 *
 * 整个类打了 @RequireAdmin：模型配置里有 API Key，普通用户不该碰。
 * 返回的 apiKey 一律是掩码值，真实 Key 只在服务端内部流转。
 */
@RestController
@RequestMapping("/api/modelConfig")
@RequireAdmin
public class ModelConfigController {

    @Autowired
    private ModelConfigService modelConfigService;

    /**
     * 分页查询模型配置
     */
    @PostMapping("/pageQuery")
    @Log("分页查询模型配置")
    public Result<IPage<ModelConfig>> pageQuery(@RequestBody @Valid ModelConfigQuery query) {
        return Result.success(modelConfigService.pageQuery(query));
    }

    /**
     * 启用中的配置列表，给编排页的模型下拉框用
     */
    @GetMapping("/listEnabled")
    public Result<List<ModelConfig>> listEnabled() {
        return Result.success(modelConfigService.listEnabled());
    }

    /**
     * 新增模型配置
     */
    @PostMapping("/add")
    @Log("新增模型配置")
    public Result<Void> add(@RequestBody @Valid ModelConfigDTO dto) {
        dto.setId(null);
        modelConfigService.saveOrUpdateConfig(dto);
        return Result.success("新增成功");
    }

    /**
     * 更新模型配置。apiKey 留空表示沿用原值。
     */
    @PutMapping("/update")
    @Log("更新模型配置")
    public Result<Void> update(@RequestBody @Valid ModelConfigDTO dto) {
        modelConfigService.saveOrUpdateConfig(dto);
        return Result.success("更新成功");
    }

    /**
     * 设为默认模型
     */
    @PutMapping("/setDefault/{id}")
    @Log("设置默认模型")
    public Result<Void> setDefault(@PathVariable Long id) {
        modelConfigService.setDefault(id);
        return Result.success("已设为默认");
    }

    /**
     * 删除模型配置
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除模型配置")
    public Result<Void> deleteById(@PathVariable Long id) {
        modelConfigService.removeConfig(id);
        return Result.success("删除成功");
    }
}
