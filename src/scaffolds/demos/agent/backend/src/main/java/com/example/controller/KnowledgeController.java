package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.KnowledgeDTO;
import com.example.dto.KnowledgeQuery;
import com.example.entity.Knowledge;
import com.example.service.KnowledgeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 知识库控制器
 *
 * 整个类要求管理员：知识库是智能体的"资料来源"，
 * 普通用户只应该通过对话间接用到它，不该直接读写。
 */
@RestController
@RequestMapping("/api/knowledge")
@RequireAdmin
public class KnowledgeController {

    @Autowired
    private KnowledgeService knowledgeService;

    /**
     * 分页查询知识条目
     */
    @PostMapping("/pageQuery")
    @Log("分页查询知识条目")
    public Result<IPage<Knowledge>> pageQuery(@RequestBody @Valid KnowledgeQuery query) {
        return Result.success(knowledgeService.pageQuery(query));
    }

    /**
     * 根据ID查询知识条目
     */
    @GetMapping("/getById/{id}")
    public Result<Knowledge> getById(@PathVariable Long id) {
        return Result.success(knowledgeService.getById(id));
    }

    /**
     * 新增知识条目。agentId 留空表示全局共享。
     */
    @PostMapping("/add")
    @Log("新增知识条目")
    public Result<Void> add(@RequestBody @Valid KnowledgeDTO dto) {
        dto.setId(null);
        knowledgeService.saveOrUpdateKnowledge(dto);
        return Result.success("新增成功");
    }

    /**
     * 更新知识条目
     */
    @PutMapping("/update")
    @Log("更新知识条目")
    public Result<Void> update(@RequestBody @Valid KnowledgeDTO dto) {
        knowledgeService.saveOrUpdateKnowledge(dto);
        return Result.success("更新成功");
    }

    /**
     * 删除知识条目
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除知识条目")
    public Result<Void> deleteById(@PathVariable Long id) {
        knowledgeService.removeById(id);
        return Result.success("删除成功");
    }

    /**
     * 批量删除知识条目
     */
    @DeleteMapping("/deleteBatch")
    @Log("批量删除知识条目")
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        knowledgeService.removeByIds(ids);
        return Result.success("批量删除成功");
    }

    /**
     * 试检索：输入一个问题，看会召回哪几条。
     *
     * 调编排时很有用——回答不对，先在这里确认是"没召回到资料"
     * 还是"召回了但模型没用好"。
     */
    @GetMapping("/testRetrieve")
    @Log("试检索知识库")
    public Result<List<Knowledge>> testRetrieve(@RequestParam Long agentId,
                                               @RequestParam String question,
                                               @RequestParam(required = false) Integer topK) {
        return Result.success(knowledgeService.retrieve(agentId, question, topK));
    }
}
