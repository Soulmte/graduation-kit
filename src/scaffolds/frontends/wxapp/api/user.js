const request = require('./request');

module.exports = {
  /** 账号密码登录（管理员后台入口用） */
  login: (username, password) => request.post('/user/login', { username, password }),
  /** 小程序登录：code 由 wx.login() 换取，后端换成 openid */
  wxLogin: (code) => request.post('/user/wxLogin', { code }),
  register: (data) => request.post('/user/register', data),
  updateUser: (data) => request.put('/user/update', data),
  updatePassword: (oldPassword, newPassword) =>
    request.put('/user/updatePassword', { oldPassword, newPassword }),
  pageQueryUser: (query) => request.post('/user/pageQuery', query)
};
