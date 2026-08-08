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
export const updateUser = (data: Partial<UserInfo> & { id: number; password?: string }) =>
  request.put('/user/update', data)
export const deleteUser = (id: number) => request.delete(`/user/deleteById/${id}`)
export const deleteUserBatch = (ids: number[]) => request.delete('/user/deleteBatch', { data: ids })
