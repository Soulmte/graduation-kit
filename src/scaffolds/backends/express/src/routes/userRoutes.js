import express from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { logMiddleware } from '../middleware/logger.js';

const router = express.Router();

// 公开接口
router.post('/register', logMiddleware('用户注册'), userController.register);
router.post('/login', logMiddleware('用户登录'), userController.login);

// 需要认证的接口
router.get('/getById/:id', authMiddleware, logMiddleware('查询用户详情'), userController.getById);
router.put('/update', authMiddleware, logMiddleware('更新用户信息'), userController.update);
router.put('/updatePassword', authMiddleware, logMiddleware('修改密码'), userController.updatePassword);

// 仅管理员可访问的接口
router.post('/pageQuery', authMiddleware, adminMiddleware, logMiddleware('分页查询用户'), userController.pageQuery);
router.get('/listAll', authMiddleware, adminMiddleware, logMiddleware('查询用户列表'), userController.listAll);
router.delete('/deleteById/:id', authMiddleware, adminMiddleware, logMiddleware('删除用户'), userController.deleteById);
router.delete('/deleteBatch', authMiddleware, adminMiddleware, logMiddleware('批量删除用户'), userController.deleteBatch);

export default router;
