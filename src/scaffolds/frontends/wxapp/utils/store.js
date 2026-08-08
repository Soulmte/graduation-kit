module.exports = {
  getToken() {
    return wx.getStorageSync('token') || '';
  },

  getUserInfo() {
    return wx.getStorageSync('userInfo') || null;
  },

  setAuth(token, userInfo) {
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
  },

  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  updateUserInfo(info) {
    wx.setStorageSync('userInfo', info);
  }
};
