import request from './request'

export const pageQueryNotice = (params) => request.post('/notice/pageQuery', params)
export const listAllNotice = () => request.get('/notice/listAll')
export const getNoticeById = (id) => request.get(`/notice/getById/${id}`)
export const addNotice = (data) => request.post('/notice/add', data)
export const updateNotice = (data) => request.put('/notice/update', data)
export const deleteNotice = (id) => request.delete(`/notice/deleteById/${id}`)
export const deleteNoticeBatch = (ids) => request.delete('/notice/deleteBatch', { data: ids })
