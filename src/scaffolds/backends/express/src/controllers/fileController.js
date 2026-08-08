/** 文件上传控制器 */
import { fileService } from '../services/fileService.js';
import { Result } from '../utils/response.js';

// 上传单个文件
export const upload = async (req, res, next) => {
  try {
    const data = await fileService.upload(req.file);
    res.json(Result.success(data, '上传成功'));
  } catch (e) { next(e); }
};

// 批量上传文件
export const uploadBatch = async (req, res, next) => {
  try {
    const data = await fileService.uploadBatch(req.files);
    res.json(Result.success(data, '批量上传成功'));
  } catch (e) { next(e); }
};

// 删除文件
export const deleteFile = async (req, res, next) => {
  try {
    fileService.delete(req.query.fileName);
    res.json(Result.success(null, '删除成功'));
  } catch (e) { next(e); }
};
