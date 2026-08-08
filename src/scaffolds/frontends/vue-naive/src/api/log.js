import request from './request'

export const pageQueryLog = (params) => request.post('/log/pageQuery', params)
export const deleteLog = (id) => request.delete(`/log/deleteById/${id}`)
export const deleteLogBatch = (ids) => request.delete('/log/deleteBatch', { data: ids })
