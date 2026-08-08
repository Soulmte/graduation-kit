/** 操作日志控制器 */
import { logService } from '../services/logService.js';
import { Result } from '../utils/response.js';

// 分页查询操作日志（带条件）
export const pageQuery = async (req, res, next) => {
  try {
    res.json(Result.success(await logService.pageQuery(req.body)));
  } catch (e) { next(e); }
};

// 查询所有操作日志
export const listAll = async (req, res, next) => {
  try {
    res.json(Result.success(await logService.listAll()));
  } catch (e) { next(e); }
};

// 根据ID查询操作日志
export const getById = async (req, res, next) => {
  try {
    res.json(Result.success(await logService.getById(req.params.id)));
  } catch (e) { next(e); }
};

// 删除操作日志
export const deleteById = async (req, res, next) => {
  try {
    await logService.deleteById(req.params.id);
    res.json(Result.success(null, '删除成功'));
  } catch (e) { next(e); }
};

// 批量删除操作日志
export const deleteBatch = async (req, res, next) => {
  try {
    await logService.deleteBatch(req.body);
    res.json(Result.success(null, '批量删除成功'));
  } catch (e) { next(e); }
};
