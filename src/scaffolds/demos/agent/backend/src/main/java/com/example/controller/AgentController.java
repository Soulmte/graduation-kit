package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.AgentQuery;
import com.example.dto.AgentSaveDTO;
import com.example.dto.GraphDTO;
import com.example.entity.Agent;
import com.example.service.AgentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 智能体控制器
 *
 * 这个类同时服务管理端与前台，权限按方法区分：
 *   管理端（@RequireAdmin）：pageQuery / add / update / saveGraph / publish / delete / getForEdit
 *   前台（登录即可）：listPublished / getPublished
 *
 * 前台的两个接口都只出已发布的，草稿会被当作不存在。
 */
@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private AgentService agentService;

    // ==================== 管理端 ====================

    /**
     * 分页查询智能体（含草稿）
     */
    @PostMapping("/pageQuery")
    @Log("分页查询智能体")
    @RequireAdmin
    public Result<IPage<Agent>> pageQuery(@RequestBody @Valid AgentQuery query) {
        return Result.success(agentService.pageQuery(query));
    }

    /**
     * 取智能体详情（管理端，草稿也能取，编排页要用）
     */
    @GetMapping("/getForEdit/{id}")
    @RequireAdmin
    public Result<Agent> getForEdit(@PathVariable Long id) {
        return Result.success(agentService.getDetail(id, false));
    }

    /**
     * 新增智能体。会自带一条「开始→检索→大模型→结束」的默认画布。
     */
    @PostMapping("/add")
    @Log("新增智能体")
    @RequireAdmin
    public Result<Void> add(@RequestBody @Valid AgentSaveDTO dto) {
        dto.setId(null);
        agentService.saveOrUpdateAgent(dto);
        return Result.success("新增成功");
    }

    /**
     * 更新智能体基础信息（不动画布）
     */
    @PutMapping("/update")
    @Log("更新智能体")
    @RequireAdmin
    public Result<Void> update(@RequestBody @Valid AgentSaveDTO dto) {
        agentService.saveOrUpdateAgent(dto);
        return Result.success("更新成功");
    }

    /**
     * 保存画布。结构不合法会直接报错，不会存进去。
     */
    @PutMapping("/saveGraph/{id}")
    @Log("保存智能体编排")
    @RequireAdmin
    public Result<Void> saveGraph(@PathVariable Long id, @RequestBody @Valid GraphDTO graph) {
        agentService.saveGraph(id, graph);
        return Result.success("编排已保存");
    }

    /**
     * 发布智能体，发布后前台可见
     */
    @PutMapping("/publish/{id}")
    @Log("发布智能体")
    @RequireAdmin
    public Result<Void> publish(@PathVariable Long id) {
        agentService.publish(id, true);
        return Result.success("发布成功");
    }

    /**
     * 撤回为草稿，前台立即不可见
     */
    @PutMapping("/unpublish/{id}")
    @Log("撤回智能体")
    @RequireAdmin
    public Result<Void> unpublish(@PathVariable Long id) {
        agentService.publish(id, false);
        return Result.success("已撤回为草稿");
    }

    /**
     * 删除智能体，名下的知识条目与会话一并清掉
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除智能体")
    @RequireAdmin
    public Result<Void> deleteById(@PathVariable Long id) {
        agentService.removeAgent(id);
        return Result.success("删除成功");
    }

    // ==================== 前台 ====================

    /**
     * 前台可用的智能体列表，只出已发布的
     */
    @GetMapping("/listPublished")
    public Result<List<Agent>> listPublished() {
        return Result.success(agentService.listPublished());
    }

    /**
     * 前台取智能体详情。草稿会报「不存在」，不泄露它的存在性。
     */
    @GetMapping("/getPublished/{id}")
    public Result<Agent> getPublished(@PathVariable Long id) {
        return Result.success(agentService.getDetail(id, true));
    }
}
