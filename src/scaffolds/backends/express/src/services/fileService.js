/** 文件服务 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadConfig } from '../config/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_BASE = path.join(__dirname, '../../../../uploads');

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.zip', '.rar', '.7z'
]);

// 最大文件大小统一取 uploadConfig，避免与路由层限制不一致
const MAX_SIZE = uploadConfig.maxSize;

export const fileService = {
  // 上传单个文件
  async upload(file) {
    validate(file);
    const url = await save(file);
    return { url, fileName: file.originalname };
  },

  // 批量上传文件
  async uploadBatch(files) {
    if (!files || files.length === 0) throw { code: 400, message: '请选择要上传的文件' };

    const success = [];
    const fail = [];

    for (const file of files) {
      try {
        validate(file);
        const url = await save(file);
        success.push({ fileName: file.originalname, url });
      } catch (e) {
        fail.push(`${file.originalname}: ${e.message}`);
      }
    }

    return { success, fail, total: files.length, successCount: success.length, failCount: fail.length };
  },

  // 删除文件
  delete(fileName) {
    if (!fileName) throw { code: 400, message: '文件名不能为空' };
    const relativePath = fileName.replace('/uploads/', '');
    const absolutePath = path.resolve(UPLOAD_BASE, relativePath);
    if (!absolutePath.startsWith(path.resolve(UPLOAD_BASE))) {
      throw { code: 400, message: '非法的文件路径' };
    }
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  }
};

function validate(file) {
  if (!file || file.size === 0) throw { code: 400, message: '文件不能为空' };
  if (file.size > MAX_SIZE) throw { code: 400, message: `文件大小不能超过${MAX_SIZE / 1024 / 1024}MB` };
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) throw { code: 400, message: `不支持的文件类型: ${ext}` };
}

async function save(file) {
  const ext = path.extname(file.originalname);
  const newName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const dateDir = new Date().toISOString().split('T')[0];
  const dir = path.join(UPLOAD_BASE, dateDir);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (file.buffer) {
    fs.writeFileSync(path.join(dir, newName), file.buffer);
  } else if (file.path) {
    fs.renameSync(file.path, path.join(dir, newName));
  }

  return `/uploads/${dateDir}/${newName}`;
}
