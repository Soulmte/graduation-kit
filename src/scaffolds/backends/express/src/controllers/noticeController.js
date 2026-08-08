/** 公告控制器 */
import { noticeService } from '../services/noticeService.js';
import { Result } from '../utils/response.js';

// 创建公告
export const add = async (req, res, next) => {
  try {
    await noticeService.add(req.body, req.user?.username);
    res.json(Result.success(null, '创建成功'));
  } catch (e) { next(e); }
};

// 分页查询公告列表（带条件）
export const pageQuery = async (req, res, next) => {
  try {
    res.json(Result.success(await noticeService.pageQuery(req.body)));
  } catch (e) { next(e); }
};

// 查询所有公告列表
export const listAll = async (req, res, next) => {
  try {
    res.json(Result.success(await noticeService.listAll()));
  } catch (e) { next(e); }
};

// 根据ID查询公告
export const getById = async (req, res, next) => {
  try {
    res.json(Result.success(await noticeService.getById(req.params.id)));
  } catch (e) { next(e); }
};

// 更新公告
export const update = async (req, res, next) => {
  try {
    await noticeService.update(req.body);
    res.json(Result.success(null, '更新成功'));
  } catch (e) { next(e); }
};

// 删除公告（逻辑删除）
export const deleteById = async (req, res, next) => {
  try {
    await noticeService.deleteById(req.params.id);
    res.json(Result.success(null, '删除成功'));
  } catch (e) { next(e); }
};

// 批量删除公告（逻辑删除）
export const deleteBatch = async (req, res, next) => {
  try {
    await noticeService.deleteBatch(req.body);
    res.json(Result.success(null, '批量删除成功'));
  } catch (e) { next(e); }
};
