import express from 'express';
import * as noticeController from '../controllers/noticeController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { logMiddleware } from '../middleware/logger.js';

const router = express.Router();

// 登录用户均可查看公告
router.post('/pageQuery', authMiddleware, logMiddleware('分页查询公告'), noticeController.pageQuery);
router.get('/listAll', authMiddleware, logMiddleware('查询公告列表'), noticeController.listAll);
router.get('/getById/:id', authMiddleware, logMiddleware('查询公告详情'), noticeController.getById);

// 公告的增删改仅管理员
router.post('/add', authMiddleware, adminMiddleware, logMiddleware('创建公告'), noticeController.add);
router.put('/update', authMiddleware, adminMiddleware, logMiddleware('更新公告'), noticeController.update);
router.delete('/deleteById/:id', authMiddleware, adminMiddleware, logMiddleware('删除公告'), noticeController.deleteById);
router.delete('/deleteBatch', authMiddleware, adminMiddleware, logMiddleware('批量删除公告'), noticeController.deleteBatch);

export default router;
