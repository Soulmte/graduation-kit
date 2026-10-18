import request from './request'

/**
 * 创建公告
 */
export const addNotice = (data) => request({
  url: '/notice/add',
  method: 'POST',
  data
})

/**
 * 分页查询公告列表
 */
export const pageQueryNotice = (query) => request({
  url: '/notice/pageQuery',
  method: 'POST',
  data: query
})

/**
 * 查询所有公告列表
 */
export const listAllNotice = () => request({
  url: '/notice/listAll'
})

/**
 * 根据ID查询公告
 */
export const getNoticeById = (id) => request({
  url: `/notice/getById/${id}`
})

/**
 * 更新公告
 */
export const updateNotice = (data) => request({
  url: '/notice/update',
  method: 'PUT',
  data
})

/**
 * 删除公告
 */
export const deleteNotice = (id) => request({
  url: `/notice/deleteById/${id}`,
  method: 'DELETE'
})

/**
 * 批量删除公告
 */
export const deleteNoticeBatch = (ids) => request({
  url: '/notice/deleteBatch',
  method: 'DELETE',
  data: ids
})
