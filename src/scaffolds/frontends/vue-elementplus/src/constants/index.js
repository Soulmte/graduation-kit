/**
 * 常量定义
 */

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}

// 用户角色标签
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.USER]: '普通用户'
}

// 响应状态码
export const RESPONSE_CODE = {
  SUCCESS: 200,
  ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404
}

// 文件上传限制
export const FILE_UPLOAD = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ACCEPT_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ACCEPT_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif']
}

// 分页配置
export const PAGINATION = {
  PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100]
}

// 日期格式
export const DATE_FORMAT = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  MONTH: 'YYYY-MM'
}

// 表单验证规则
export const FORM_RULES = {
  REQUIRED: { required: true, message: '此项为必填项', trigger: 'blur' },
  EMAIL: { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  PHONE: { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  USERNAME: {
    pattern: /^[a-zA-Z0-9_]{4,16}$/,
    message: '用户名为4-16位字母、数字或下划线',
    trigger: 'blur'
  },
  PASSWORD: { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
}
