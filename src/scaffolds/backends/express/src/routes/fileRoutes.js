import express from 'express';
import multer from 'multer';
import * as fileController from '../controllers/fileController.js';
import { authMiddleware } from '../middleware/auth.js';
import { logMiddleware } from '../middleware/logger.js';
import { uploadConfig } from '../config/upload.js';

const router = express.Router();

// 使用 memoryStorage，由 fileService 统一处理存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadConfig.maxSize }
});

router.post('/upload', authMiddleware, logMiddleware('上传文件'), upload.single('file'), fileController.upload);
router.post('/uploadBatch', authMiddleware, logMiddleware('批量上传文件'), upload.array('files'), fileController.uploadBatch);
router.delete('/delete', authMiddleware, logMiddleware('删除文件'), fileController.deleteFile);

export default router;
