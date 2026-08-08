/** 用户服务 */
import db from '../config/database.js';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { ResultCode, normalizePage } from '../utils/response.js';

const USER_COLUMNS = 'id, username, nickname, age, gender, phone, email, avatar, role, create_time, update_time';

export const userService = {
  // 用户注册
  async register(user) {
    const { username, password } = user;
    if (!username || !password) throw { code: ResultCode.BAD_REQUEST, message: '用户名和密码不能为空' };

    const [existing] = await db.execute('SELECT id FROM user WHERE username = ? AND deleted = 0', [username]);
    if (existing.length > 0) throw { code: ResultCode.USERNAME_EXIST, message: '用户名已存在' };

    await db.execute(
      'INSERT INTO user (username, password, nickname, age, gender, phone, email, role, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [username, password, user.nickname || '', user.age || null, user.gender || '', user.phone || '', user.email || '', 'user']
    );
  },

  // 用户登录
  async login(username, password) {
    if (!username || !password) throw { code: ResultCode.BAD_REQUEST, message: '用户名和密码不能为空' };

    const [users] = await db.execute(
      `SELECT ${USER_COLUMNS} FROM user WHERE username = ? AND password = ? AND deleted = 0`,
      [username, password]
    );
    if (users.length === 0) throw { code: ResultCode.LOGIN_ERROR, message: '用户名或密码错误' };

    const user = users[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return { token, userInfo: user };
  },

  // 分页查询用户列表（带条件）
  async pageQuery(query) {
    const { username, email, role, orderBy, order = 'desc' } = query;
    const { pageNum, pageSize, offset } = normalizePage(query.pageNum, query.pageSize);

    let where = 'WHERE deleted = 0';
    const params = [];

    if (username) { where += ' AND username LIKE ?'; params.push(`%${username}%`); }
    if (email) { where += ' AND email LIKE ?'; params.push(`%${email}%`); }
    if (role) { where += ' AND role = ?'; params.push(role); }

    const orderCol = { username: 'username', email: 'email', role: 'role', createTime: 'create_time' }[orderBy] || 'create_time';
    const dir = order === 'asc' ? 'ASC' : 'DESC';

    const [total] = await db.execute(`SELECT COUNT(*) as total FROM user ${where}`, params);
    // LIMIT/OFFSET 不能用占位符（mysql2 预处理不支持），值已经 normalizePage 归一为整数
    const [records] = await db.execute(
      `SELECT ${USER_COLUMNS} FROM user ${where} ORDER BY ${orderCol} ${dir} LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    return { records, total: total[0].total, pageNum, pageSize };
  },

  // 查询所有用户列表
  async listAll() {
    const [records] = await db.execute(
      `SELECT ${USER_COLUMNS} FROM user WHERE deleted = 0 ORDER BY create_time DESC`
    );
    return records;
  },

  // 根据ID查询用户
  async getById(id) {
    const [rows] = await db.execute(
      `SELECT ${USER_COLUMNS} FROM user WHERE id = ? AND deleted = 0`, [id]
    );
    if (rows.length === 0) throw { code: ResultCode.NOT_FOUND, message: '用户不存在' };
    return rows[0];
  },

  // 更新用户信息
  // 只接受可修改字段，role与password不可通过本接口修改
  // currentUser 由控制层传入，普通用户只能改自己
  async update(user, currentUser) {
    const { id, nickname, age, gender, phone, email, avatar } = user;
    if (!id) throw { code: ResultCode.BAD_REQUEST, message: '用户ID不能为空' };

    if (currentUser?.role !== 'admin' && Number(id) !== Number(currentUser?.id)) {
      throw { code: ResultCode.FORBIDDEN, message: '权限不足，只能修改自己的信息' };
    }

    const [exist] = await db.execute('SELECT id FROM user WHERE id = ? AND deleted = 0', [id]);
    if (exist.length === 0) throw { code: ResultCode.NOT_FOUND, message: '用户不存在' };

    await db.execute(
      'UPDATE user SET nickname = ?, age = ?, gender = ?, phone = ?, email = ?, avatar = ?, update_time = NOW() WHERE id = ? AND deleted = 0',
      [nickname || '', age || null, gender || '', phone || '', email || '', avatar || '', id]
    );
  },

  // 修改当前登录用户的密码
  // 用户ID从登录态取，不接受前端传入
  async updatePassword(body, currentUser) {
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword) {
      throw { code: ResultCode.BAD_REQUEST, message: '原密码和新密码不能为空' };
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      throw { code: ResultCode.BAD_REQUEST, message: '新密码长度必须在6-20位之间' };
    }

    const [rows] = await db.execute('SELECT password FROM user WHERE id = ? AND deleted = 0', [currentUser.id]);
    if (rows.length === 0) throw { code: ResultCode.NOT_FOUND, message: '用户不存在' };
    if (rows[0].password !== oldPassword) {
      throw { code: ResultCode.PASSWORD_ERROR, message: '原密码错误' };
    }

    await db.execute(
      'UPDATE user SET password = ?, update_time = NOW() WHERE id = ? AND deleted = 0',
      [newPassword, currentUser.id]
    );
  },

  // 删除用户（逻辑删除）
  async deleteById(id) {
    await db.execute('UPDATE user SET deleted = 1 WHERE id = ?', [id]);
  },

  // 批量删除用户（逻辑删除）
  async deleteBatch(ids) {
    if (!ids || ids.length === 0) throw { code: ResultCode.BAD_REQUEST, message: '参数错误' };
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`UPDATE user SET deleted = 1 WHERE id IN (${placeholders})`, ids);
  }
};
