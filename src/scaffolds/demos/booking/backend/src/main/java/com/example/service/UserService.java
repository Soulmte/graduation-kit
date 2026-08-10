package com.example.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.example.dto.PasswordUpdateDTO;
import com.example.dto.UserQuery;
import com.example.dto.UserUpdateDTO;
import com.example.entity.User;

/**
 * 用户服务接口
 */
public interface UserService extends IService<User> {
    /**
     * 根据用户名查询用户
     */
    User findByUsername(String username);
    
    /**
     * 用户登录
     */
    String login(String username, String password);
    
    /**
     * 分页查询用户列表（带条件）
     */
    IPage<User> pageQuery(UserQuery query);
    
    /**
     * 用户注册
     */
    void register(User user);

    /**
     * 更新用户信息
     * 普通用户只能改自己，管理员可以改任何人
     */
    void updateInfo(UserUpdateDTO dto);

    /**
     * 修改当前登录用户的密码
     */
    void updatePassword(PasswordUpdateDTO dto);
}
