/** 操作日志记录中间件 */
import db from '../config/database.js';

// 操作日志记录中间件（请求结束后异步写入日志）
export const logMiddleware = (operation) => {
  return (req, res, next) => {
    const startTime = Date.now();

    // 提前提取用户名（防止handler修改body后取不到）
    const username = req.user?.username || req.body?.username || 'anonymous';

    const originalJson = res.json;
    res.json = function (data) {
      const executeTime = Date.now() - startTime;
      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
      const method = `${req.method} ${req.originalUrl}`;

      // 操作描述：失败时附加标记
      let op = operation;
      if (data.code !== 200) {
        op = `${op}[失败:${data.message || '未知错误'}]`;
        if (op.length > 100) op = op.substring(0, 100);
      }

      // 参数（排除一切密码类字段）
      let params = null;
      try {
        const body = { ...req.body };
        Object.keys(body).forEach(k => {
          if (/password/i.test(k)) delete body[k];
        });
        if (Object.keys(body).length > 0) {
          params = JSON.stringify(body);
          if (params.length > 2000) params = params.substring(0, 2000) + '...';
        }
      } catch { /* ignore */ }

      db.execute(
        'INSERT INTO operation_log (username, operation, method, params, execute_time, ip, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [username, op, method, params, executeTime, ip]
      ).catch(err => console.error('日志记录失败:', err.message));

      return originalJson.call(this, data);
    };

    next();
  };
};
