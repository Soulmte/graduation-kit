import request from './request'

/**
 * 分页查询操作日志
 */
export const pageQueryLog = (query) => request({
  url: '/log/pageQuery',
  method: 'POST',
  data: query
})

/**
 * 查询所有操作日志
 */
export const listAllLog = () => request({
  url: '/log/listAll'
})

/**
 * 根据ID查询操作日志
 */
export const getLogById = (id) => request({
  url: `/log/getById/${id}`
})

/**
 * 删除操作日志
 */
export const deleteLog = (id) => request({
  url: `/log/deleteById/${id}`,
  method: 'DELETE'
})

/**
 * 批量删除操作日志
 */
export const deleteLogBatch = (ids) => request({
  url: '/log/deleteBatch',
  method: 'DELETE',
  data: ids
})
