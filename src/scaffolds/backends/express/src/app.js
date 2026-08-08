import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 导入配置
import { serverConfig } from './config/server.js';
import { corsConfig } from './config/cors.js';
import db from './config/database.js';

// 导入路由
import userRoutes from './routes/userRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import logRoutes from './routes/logRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 路由
app.use('/api/user', userRoutes);
app.use('/api/notice', noticeRoutes);
app.use('/api/log', logRoutes);
app.use('/api/file', fileRoutes);

// 健康检查（含数据库连通性）
app.get('/api/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await db.execute('SELECT 1');
  } catch (e) {
    // 不向外暴露异常详情，避免泄露数据库连接信息
    console.error('数据库连接异常:', e.message);
    dbStatus = 'error';
  }
  res.json({
    code: 200,
    message: '操作成功',
    data: { service: 'Express', database: dbStatus }
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(serverConfig.port, () => {
  console.log('========================================');
  console.log('Express + MySQL Backend Server');
  console.log('========================================');
  console.log(`Server: http://localhost:${serverConfig.port}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log('========================================');
});

export default app;
