const { BASE_URL } = require('../../config/index');

Page({
  data: {
    version: '1.0.0',
    baseUrl: BASE_URL,
    rows: [
      { label: '框架', value: '微信小程序原生' },
      { label: '组件库', value: 'TDesign 小程序版' },
      { label: '后端', value: 'Spring Boot 3（小程序专用）' },
      { label: '数据库', value: 'MySQL 8 / utf8mb4' },
      { label: '登录', value: '微信 openid + JWT' }
    ]
  }
});
