package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.common.result.ResultCode;
import com.example.dto.PasswordUpdateDTO;
import com.example.dto.UserQuery;
import com.example.dto.UserUpdateDTO;
import com.example.entity.User;
import com.example.common.exception.BusinessException;
import com.example.mapper.UserMapper;
import com.example.service.UserService;
import com.example.common.util.JwtUtil;
import com.example.common.util.UserContext;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 用户服务实现类
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
    
    @Override
    public User findByUsername(String username) {
        return this.getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
    }
    
    @Override
    public String login(String username, String password) {
        User user = findByUsername(username);
        if (user == null || !user.getPassword().equals(password)) {
            throw new BusinessException(ResultCode.LOGIN_ERROR);
        }
        return JwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
    }
    
    @Override
    public IPage<User> pageQuery(UserQuery query) {
        Page<User> page = new Page<>(query.getPageNum(), query.getPageSize());
        
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        
        // 用户名模糊查询
        if (StringUtils.hasText(query.getUsername())) {
            wrapper.like(User::getUsername, query.getUsername());
        }
        
        // 邮箱模糊查询
        if (StringUtils.hasText(query.getEmail())) {
            wrapper.like(User::getEmail, query.getEmail());
        }
        
        // 角色精确查询
        if (StringUtils.hasText(query.getRole())) {
            wrapper.eq(User::getRole, query.getRole());
        }
        
        // 排序
        if (StringUtils.hasText(query.getOrderBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getOrder());
            switch (query.getOrderBy()) {
                case "username" -> wrapper.orderBy(true, isAsc, User::getUsername);
                case "email" -> wrapper.orderBy(true, isAsc, User::getEmail);
                case "role" -> wrapper.orderBy(true, isAsc, User::getRole);
                case "createTime" -> wrapper.orderBy(true, isAsc, User::getCreateTime);
                default -> wrapper.orderByDesc(User::getCreateTime);
            }
        } else {
            wrapper.orderByDesc(User::getCreateTime);
        }
        
        return this.page(page, wrapper);
    }
    
    @Override
    public void register(User user) {
        // 用户名和密码必填
        if (!StringUtils.hasText(user.getUsername()) || !StringUtils.hasText(user.getPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "用户名和密码不能为空");
        }
        
        // 检查用户名是否已存在
        User existUser = findByUsername(user.getUsername());
        if (existUser != null) {
            throw new BusinessException(ResultCode.USERNAME_EXIST);
        }
        
        // 角色固定为普通用户，不接受前端传入，防止自行注册管理员
        user.setRole("user");
        
        this.save(user);
    }

    @Override
    public void updateInfo(UserUpdateDTO dto) {
        // 普通用户只能修改自己的信息
        if (!UserContext.isAdmin() && !dto.getId().equals(UserContext.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }

        User exist = this.getById(dto.getId());
        if (exist == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST);
        }

        // 只拷贝DTO中的字段，role与password不可通过本接口修改
        User user = new User();
        BeanUtils.copyProperties(dto, user);
        this.updateById(user);
    }

    @Override
    public void updatePassword(PasswordUpdateDTO dto) {
        // 只能修改自己的密码，用户ID从登录态取，不接受前端传入
        User exist = this.getById(UserContext.getUserId());
        if (exist == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST);
        }

        // 校验原密码
        if (!exist.getPassword().equals(dto.getOldPassword())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }

        User user = new User();
        user.setId(exist.getId());
        user.setPassword(dto.getNewPassword());
        this.updateById(user);
    }
}
