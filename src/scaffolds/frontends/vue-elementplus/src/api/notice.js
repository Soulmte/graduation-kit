import request from './request'

/** 分页查询公告 */
export const pageQueryNotice = (params) => request.post('/notice/pageQuery', params)

/** 查询所有公告 */
export const listAllNotice = () => request.get('/notice/listAll')

/** 获取公告详情 */
export const getNoticeById = (id) => request.get(`/notice/getById/${id}`)

/** 创建公告 */
export const addNotice = (data) => request.post('/notice/add', data)

/** 更新公告 */
export const updateNotice = (data) => request.put('/notice/update', data)

/** 删除公告 */
export const deleteNotice = (id) => request.delete(`/notice/deleteById/${id}`)

/** 批量删除公告 */
export const deleteNoticeBatch = (ids) => request.delete('/notice/deleteBatch', { data: ids })
