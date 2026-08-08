import dotenv from 'dotenv';

dotenv.config();

/**
 * JWT配置
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '7d'
};
