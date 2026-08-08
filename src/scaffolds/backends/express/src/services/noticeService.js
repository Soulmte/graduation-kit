/** 公告服务 */
import db from '../config/database.js';
import { ResultCode, normalizePage } from '../utils/response.js';

const NOTICE_COLUMNS = 'id, title, content, create_by, create_time, update_time';

export const noticeService = {
  // 创建公告
  // createBy 由控制层从登录信息传入，不信任前端
  async add(notice, createBy) {
    const { title, content } = notice;
    if (!title) throw { code: ResultCode.BAD_REQUEST, message: '标题不能为空' };
    await db.execute(
      'INSERT INTO notice (title, content, create_by, create_time) VALUES (?, ?, ?, NOW())',
      [title, content || '', createBy || null]
    );
  },

  // 分页查询公告列表（带条件）
  async pageQuery(query) {
    const { title, content, orderBy, order = 'desc' } = query;
    const { pageNum, pageSize, offset } = normalizePage(query.pageNum, query.pageSize);

    let where = 'WHERE deleted = 0';
    const params = [];

    if (title) { where += ' AND title LIKE ?'; params.push(`%${title}%`); }
    if (content) { where += ' AND content LIKE ?'; params.push(`%${content}%`); }

    const orderCol = { title: 'title', createTime: 'create_time', updateTime: 'update_time' }[orderBy] || 'create_time';
    const dir = order === 'asc' ? 'ASC' : 'DESC';

    const [total] = await db.execute(`SELECT COUNT(*) as total FROM notice ${where}`, params);
    // LIMIT/OFFSET 不能用占位符（mysql2 预处理不支持），值已经 normalizePage 归一为整数
    const [records] = await db.execute(
      `SELECT ${NOTICE_COLUMNS} FROM notice ${where} ORDER BY ${orderCol} ${dir} LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    return { records, total: total[0].total, pageNum, pageSize };
  },

  // 查询所有公告列表
  async listAll() {
    const [records] = await db.execute(`SELECT ${NOTICE_COLUMNS} FROM notice WHERE deleted = 0 ORDER BY create_time DESC`);
    return records;
  },

  // 根据ID查询公告
  async getById(id) {
    const [rows] = await db.execute(`SELECT ${NOTICE_COLUMNS} FROM notice WHERE id = ? AND deleted = 0`, [id]);
    if (rows.length === 0) throw { code: ResultCode.NOT_FOUND, message: '公告不存在' };
    return rows[0];
  },

  // 更新公告
  async update(notice) {
    const { id, title, content } = notice;
    if (!id || !title) throw { code: ResultCode.BAD_REQUEST, message: '参数错误' };
    await db.execute(
      'UPDATE notice SET title = ?, content = ?, update_time = NOW() WHERE id = ? AND deleted = 0',
      [title, content || '', id]
    );
  },

  // 删除公告（逻辑删除）
  async deleteById(id) {
    await db.execute('UPDATE notice SET deleted = 1 WHERE id = ?', [id]);
  },

  // 批量删除公告（逻辑删除）
  async deleteBatch(ids) {
    if (!ids || ids.length === 0) throw { code: ResultCode.BAD_REQUEST, message: '参数错误' };
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`UPDATE notice SET deleted = 1 WHERE id IN (${placeholders})`, ids);
  }
};
