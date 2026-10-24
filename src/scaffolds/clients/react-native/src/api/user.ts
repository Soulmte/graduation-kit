import request from './request'

export interface UserInfo {
  id: number
  username: string
  nickname?: string
  age?: number
  gender?: 'male' | 'female' | 'other' | ''
  phone?: string
  email?: string
  role: 'admin' | 'user'
  avatar?: string
  createTime?: string
  updateTime?: string
}

export interface RegisterPayload {
  username: string
  password: string
  nickname?: string
  age?: number
  gender?: string
  phone?: string
  email?: string
  role?: string
}

export type UpdateUserPayload = Omit<Partial<UserInfo>, 'gender'> & {
  id: number
  password?: string
  // 表单里性别是受控输入，可能是空串，提交时再按后端约定处理
  gender?: string
}

/** 修改密码入参：后端只改当前登录用户，不接受 userId */
export interface PasswordUpdatePayload {
  oldPassword: string
  newPassword: string
}

export interface PageQuery {
  pageNum: number
  pageSize: number
  username?: string
  role?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

export const login = (username: string, password: string) =>
  request.post<any, { code: number; message: string; data: { token: string; userInfo: UserInfo } }>(
    '/user/login', { username, password }
  )

export const register = (data: RegisterPayload) => request.post('/user/register', data)
export const pageQueryUser = (q: PageQuery) =>
  request.post<any, { code: number; message: string; data: PageResult<UserInfo> }>('/user/pageQuery', q)
export const listAllUser = () => request.get('/user/listAll')
export const getUserById = (id: number) => request.get(`/user/getById/${id}`)
export const updateUser = (data: UpdateUserPayload) =>
  request.put('/user/update', data)
export const updatePassword = (data: PasswordUpdatePayload) =>
  request.put('/user/updatePassword', data)
export const deleteUser = (id: number) => request.delete(`/user/deleteById/${id}`)
export const deleteUserBatch = (ids: number[]) => request.delete('/user/deleteBatch', { data: ids })
