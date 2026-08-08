import dotenv from 'dotenv';

dotenv.config();

/**
 * 文件上传配置
 */
export const uploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  uploadDir: process.env.UPLOAD_DIR || '../../uploads'
};
