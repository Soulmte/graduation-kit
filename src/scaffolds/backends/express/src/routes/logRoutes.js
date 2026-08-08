import express from 'express';
import * as logController from '../controllers/logController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { logMiddleware } from '../middleware/logger.js';

const router = express.Router();

// 日志属于管理数据，全部接口仅管理员可访问
router.post('/pageQuery', authMiddleware, adminMiddleware, logMiddleware('分页查询操作日志'), logController.pageQuery);
router.get('/listAll', authMiddleware, adminMiddleware, logMiddleware('查询操作日志列表'), logController.listAll);
router.get('/getById/:id', authMiddleware, adminMiddleware, logMiddleware('查询操作日志详情'), logController.getById);
router.delete('/deleteById/:id', authMiddleware, adminMiddleware, logMiddleware('删除操作日志'), logController.deleteById);
router.delete('/deleteBatch', authMiddleware, adminMiddleware, logMiddleware('批量删除操作日志'), logController.deleteBatch);

export default router;
