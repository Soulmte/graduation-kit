import request from './request'

/** 分页查询日志 */
export const pageQueryLog = (params) => request.post('/log/pageQuery', params)

/** 删除日志 */
export const deleteLog = (id) => request.delete(`/log/deleteById/${id}`)

/** 批量删除日志 */
export const deleteLogBatch = (ids) => request.delete('/log/deleteBatch', { data: ids })
