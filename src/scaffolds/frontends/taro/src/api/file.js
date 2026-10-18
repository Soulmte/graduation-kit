import { upload } from './request'

/**
 * 上传单个文件
 */
export const uploadFile = (filePath) => upload(filePath)
