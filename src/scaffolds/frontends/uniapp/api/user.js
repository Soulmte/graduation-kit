import request from './request'

/**
 * 用户注册
 */
export const register = (data) => request({
  url: '/user/register',
  method: 'POST',
  data
})

/**
 * 用户登录
 */
export const login = (username, password) => request({
  url: '/user/login',
  method: 'POST',
  data: { username, password }
})

/**
 * 分页查询用户列表
 */
export const pageQueryUser = (query) => request({
  url: '/user/pageQuery',
  method: 'POST',
  data: query
})

/**
 * 查询所有用户列表
 */
export const listAllUser = () => request({
  url: '/user/listAll'
})

/**
 * 根据ID查询用户
 */
export const getUserById = (id) => request({
  url: `/user/getById/${id}`
})

/**
 * 更新用户信息
 */
export const updateUser = (data) => request({
  url: '/user/update',
  method: 'PUT',
  data
})

/**
 * 修改密码（只能改自己的，需校验原密码）
 */
export const updatePassword = (oldPassword, newPassword) => request({
  url: '/user/updatePassword',
  method: 'PUT',
  data: { oldPassword, newPassword }
})

/**
 * 删除用户
 */
export const deleteUser = (id) => request({
  url: `/user/deleteById/${id}`,
  method: 'DELETE'
})

/**
 * 批量删除用户
 */
export const deleteUserBatch = (ids) => request({
  url: '/user/deleteBatch',
  method: 'DELETE',
  data: ids
})
