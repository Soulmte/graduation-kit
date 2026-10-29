package com.example.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class UserQuery extends PageQuery {
    /**
     * 用户名（模糊查询）
     */
    private String username;
    
    /**
     * 邮箱（模糊查询）
     */
    private String email;
    
    /**
     * 角色（精确查询）
     */
    private String role;
}
