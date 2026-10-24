import request from './request'

export interface Notice {
  id: number
  title: string
  content: string
  createTime: string
  updateTime: string
}

export const pageQueryNotice = (q: { pageNum: number; pageSize: number; title?: string }) =>
  request.post<any, { code: number; message: string; data: { records: Notice[]; total: number } }>(
    '/notice/pageQuery', q
  )
export const listAllNotice = () => request.get('/notice/listAll')
export const getNoticeById = (id: number | string) =>
  request.get<any, { code: number; message: string; data: Notice }>(`/notice/getById/${id}`)
