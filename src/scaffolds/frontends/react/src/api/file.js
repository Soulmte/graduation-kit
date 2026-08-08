import request from '../utils/request'

/**
 * 上传单个文件
 */
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 批量上传文件
 */
export const uploadFileBatch = (files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return request.post('/file/uploadBatch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 删除文件
 */
export const deleteFile = (fileName) => {
  return request.delete('/file/delete', { params: { fileName } })
}
