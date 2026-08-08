/** 统一响应格式 */

// 下划线转驼峰：create_time -> createTime
const toCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// 递归转换对象/数组的键名，使数据库下划线字段对前端统一为驼峰
// Date 等非普通对象原样返回，不做展平
const keysToCamel = (data) => {
  if (Array.isArray(data)) return data.map(keysToCamel);
  if (data === null || typeof data !== 'object' || data instanceof Date) return data;
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [toCamel(k), keysToCamel(v)])
  );
};

export const Result = {
  success(data = null, message = '操作成功') {
    return { code: 200, message, data: keysToCamel(data) };
  },
  error(message = '操作失败', code = 500) {
    return { code, message, data: null };
  }
};

export const ResultCode = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  LOGIN_ERROR: 1001,
  USERNAME_EXIST: 1002,
  PASSWORD_ERROR: 1004,
};

// 分页参数归一：页码最小1，每页数量限制在1-500
export const normalizePage = (pageNum, pageSize) => {
  const num = Math.max(1, parseInt(pageNum) || 1);
  const size = Math.min(500, Math.max(1, parseInt(pageSize) || 10));
  return { pageNum: num, pageSize: size, offset: (num - 1) * size };
};
