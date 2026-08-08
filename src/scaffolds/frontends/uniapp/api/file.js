import { upload } from './request'

/**
 * 上传单个文件
 * 使用 uni.uploadFile 而非 axios
 */
export const uploadFile = (filePath) => upload(filePath)
