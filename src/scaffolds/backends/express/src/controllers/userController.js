/** 用户控制器 */
import { userService } from '../services/userService.js';
import { Result } from '../utils/response.js';

// 用户注册
export const register = async (req, res, next) => {
  try {
    await userService.register(req.body);
    res.json(Result.success(null, '注册成功'));
  } catch (e) { next(e); }
};

// 用户登录
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await userService.login(username, password);
    res.json(Result.success(data, '登录成功'));
  } catch (e) { next(e); }
};

// 分页查询用户列表（带条件）
export const pageQuery = async (req, res, next) => {
  try {
    res.json(Result.success(await userService.pageQuery(req.body)));
  } catch (e) { next(e); }
};

// 查询所有用户列表
export const listAll = async (req, res, next) => {
  try {
    res.json(Result.success(await userService.listAll()));
  } catch (e) { next(e); }
};

// 根据ID查询用户
export const getById = async (req, res, next) => {
  try {
    res.json(Result.success(await userService.getById(req.params.id)));
  } catch (e) { next(e); }
};

// 更新用户信息
export const update = async (req, res, next) => {
  try {
    await userService.update(req.body, req.user);
    res.json(Result.success(null, '更新成功'));
  } catch (e) { next(e); }
};

// 修改密码
export const updatePassword = async (req, res, next) => {
  try {
    await userService.updatePassword(req.body, req.user);
    res.json(Result.success(null, '密码修改成功'));
  } catch (e) { next(e); }
};

// 删除用户（逻辑删除）
export const deleteById = async (req, res, next) => {
  try {
    await userService.deleteById(req.params.id);
    res.json(Result.success(null, '删除成功'));
  } catch (e) { next(e); }
};

// 批量删除用户（逻辑删除）
export const deleteBatch = async (req, res, next) => {
  try {
    await userService.deleteBatch(req.body);
    res.json(Result.success(null, '批量删除成功'));
  } catch (e) { next(e); }
};
