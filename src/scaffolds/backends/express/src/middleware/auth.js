/** JWT 认证中间件 */
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { Result, ResultCode } from '../utils/response.js';

// JWT 认证中间件
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.json(Result.error('未授权，请先登录', ResultCode.UNAUTHORIZED));
  }

  try {
    req.user = jwt.verify(token, jwtConfig.secret);
    next();
  } catch {
    return res.status(401).json({ code: 401, message: 'Token无效或已过期', data: null });
  }
};

// 管理员权限中间件（必须配合 authMiddleware 使用）
export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.json(Result.error('权限不足，禁止访问', ResultCode.FORBIDDEN));
  }
  next();
};
