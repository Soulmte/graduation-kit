/** 全局错误处理中间件 */
import { Result } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  // 唯一索引冲突：并发插入重复数据时由数据库约束兜住
  if (err.code === 'ER_DUP_ENTRY') {
    return res.json(Result.error('数据已存在', 400));
  }

  // 业务异常：service 层主动抛出的 { code, message }
  if (typeof err.code === 'number' && err.message) {
    return res.json(Result.error(err.message, err.code));
  }

  // 系统异常：不向前端暴露详情，避免泄露内部实现
  console.error('系统异常:', err);
  res.json(Result.error('服务器内部错误', 500));
};
