package com.example.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.example.common.annotation.Log;
import com.example.common.annotation.RequireAdmin;
import com.example.common.result.Result;
import com.example.dto.PasswordUpdateDTO;
import com.example.dto.UserQuery;
import com.example.dto.UserUpdateDTO;
import com.example.entity.User;
import com.example.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/user")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    /**
     * 用户注册
     */
    @PostMapping("/register")
    @Log("用户注册")
    public Result<Void> register(@RequestBody User user) {
        userService.register(user);
        return Result.success("注册成功");
    }
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    @Log(value = "用户登录", saveParams = false)
    public Result<Map<String, Object>> login(@RequestBody User user) {
        String token = userService.login(user.getUsername(), user.getPassword());
        User loginUser = userService.findByUsername(user.getUsername());
        loginUser.setPassword(null);

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userInfo", loginUser);
        return Result.success("登录成功", data);
    }
    
    /**
     * 分页查询用户列表（带条件）
     */
    @PostMapping("/pageQuery")
    @Log("分页查询用户")
    @RequireAdmin
    public Result<IPage<User>> pageQuery(@RequestBody @Valid UserQuery query) {
        IPage<User> page = userService.pageQuery(query);
        page.getRecords().forEach(u -> u.setPassword(null));
        return Result.success(page);
    }
    
    /**
     * 查询所有用户列表
     */
    @GetMapping("/listAll")
    @Log("查询用户列表")
    @RequireAdmin
    public Result<List<User>> listAll() {
        List<User> users = userService.list();
        users.forEach(u -> u.setPassword(null));
        return Result.success(users);
    }
    
    /**
     * 根据ID查询用户
     */
    @GetMapping("/getById/{id}")
    @Log("查询用户详情")
    public Result<User> getById(@PathVariable Long id) {
        User user = userService.getById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return Result.success(user);
    }
    
    /**
     * 更新用户信息
     * 普通用户只能改自己，role与password不可通过本接口修改
     */
    @PutMapping("/update")
    @Log("更新用户信息")
    public Result<Void> update(@RequestBody @Valid UserUpdateDTO dto) {
        userService.updateInfo(dto);
        return Result.success("更新成功");
    }
    
    /**
     * 修改密码
     * 只能改自己的密码，需校验原密码
     */
    @PutMapping("/updatePassword")
    @Log(value = "修改密码", saveParams = false)
    public Result<Void> updatePassword(@RequestBody @Valid PasswordUpdateDTO dto) {
        userService.updatePassword(dto);
        return Result.success("密码修改成功");
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/deleteById/{id}")
    @Log("删除用户")
    @RequireAdmin
    public Result<Void> deleteById(@PathVariable Long id) {
        userService.removeById(id);
        return Result.success("删除成功");
    }
    
    /**
     * 批量删除用户
     */
    @DeleteMapping("/deleteBatch")
    @Log("批量删除用户")
    @RequireAdmin
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        userService.removeByIds(ids);
        return Result.success("批量删除成功");
    }
}
