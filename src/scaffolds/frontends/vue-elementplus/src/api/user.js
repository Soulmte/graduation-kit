import request from './request'

/** 用户登录 */
export const login = (username, password) => request.post('/user/login', { username, password })

/** 用户注册 */
export const register = (data) => request.post('/user/register', data)

/** 分页查询用户 */
export const pageQueryUser = (params) => request.post('/user/pageQuery', params)

/** 查询所有用户 */
export const listAllUser = () => request.get('/user/listAll')

/** 根据 ID 查询用户 */
export const getUserById = (id) => request.get(`/user/getById/${id}`)

/** 更新用户 */
export const updateUser = (data) => request.put('/user/update', data)

/** 修改密码（只能改自己的，需校验原密码） */
export const updatePassword = (oldPassword, newPassword) =>
  request.put('/user/updatePassword', { oldPassword, newPassword })

/** 删除用户 */
export const deleteUser = (id) => request.delete(`/user/deleteById/${id}`)

/** 批量删除用户 */
export const deleteUserBatch = (ids) => request.delete('/user/deleteBatch', { data: ids })
