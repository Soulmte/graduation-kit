/** 操作日志服务 */
import db from '../config/database.js';
import { ResultCode, normalizePage } from '../utils/response.js';

export const logService = {
  // 分页查询操作日志（带条件）
  async pageQuery(query) {
    const { username, operation, startTime, endTime, orderBy, order = 'desc' } = query;
    const { pageNum, pageSize, offset } = normalizePage(query.pageNum, query.pageSize);

    let where = 'WHERE 1=1';
    const params = [];

    if (username) { where += ' AND username LIKE ?'; params.push(`%${username}%`); }
    if (operation) { where += ' AND operation LIKE ?'; params.push(`%${operation}%`); }
    if (startTime) { where += ' AND create_time >= ?'; params.push(startTime); }
    if (endTime) { where += ' AND create_time <= ?'; params.push(endTime); }

    const orderCol = { username: 'username', operation: 'operation', executeTime: 'execute_time', createTime: 'create_time' }[orderBy] || 'create_time';
    const dir = order === 'asc' ? 'ASC' : 'DESC';

    const [total] = await db.execute(`SELECT COUNT(*) as total FROM operation_log ${where}`, params);
    // LIMIT/OFFSET 不能用占位符（mysql2 预处理不支持），值已经 normalizePage 归一为整数
    const [records] = await db.execute(
      `SELECT * FROM operation_log ${where} ORDER BY ${orderCol} ${dir} LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    return { records, total: total[0].total, pageNum, pageSize };
  },

  // 查询所有操作日志
  async listAll() {
    const [records] = await db.execute('SELECT * FROM operation_log ORDER BY create_time DESC');
    return records;
  },

  // 根据ID查询操作日志
  async getById(id) {
    const [rows] = await db.execute('SELECT * FROM operation_log WHERE id = ?', [id]);
    if (rows.length === 0) throw { code: ResultCode.NOT_FOUND, message: '日志不存在' };
    return rows[0];
  },

  // 删除操作日志
  async deleteById(id) {
    await db.execute('DELETE FROM operation_log WHERE id = ?', [id]);
  },

  // 批量删除操作日志
  async deleteBatch(ids) {
    if (!ids || ids.length === 0) throw { code: ResultCode.BAD_REQUEST, message: '参数错误' };
    const placeholders = ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM operation_log WHERE id IN (${placeholders})`, ids);
  }
};
