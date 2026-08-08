import dotenv from 'dotenv';

dotenv.config();

/**
 * 服务器配置
 */
export const serverConfig = {
  port: process.env.PORT || 8081,
  env: process.env.NODE_ENV || 'development'
};
