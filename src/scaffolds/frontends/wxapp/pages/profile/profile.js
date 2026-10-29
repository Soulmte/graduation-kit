const store = require('../../utils/store');
const { resolveAvatar } = require('../../utils/util');

/**
 * 我的（一级页面）
 * 只做导航与概览：头像、角色、入口列表；改资料、改密码都在二级页
 */
Page({
  data: {
    userInfo: {},
    name: '',
    roleText: '普通用户',
    avatarUrl: ''
  },

  onShow() {
    const userInfo = store.getUserInfo() || {};
    this.setData({
      userInfo,
      name: userInfo.nickname || userInfo.username || '未登录',
      roleText: userInfo.role === 'admin' ? '管理员' : '普通用户',
      avatarUrl: resolveAvatar(userInfo.avatar)
    });
  },

  goEdit() {
    if (!this.data.userInfo.id) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/profile/edit' });
  },

  goPassword() {
    if (!this.data.userInfo.id) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/profile/password' });
  },

  goAgreement(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/profile/agreement?type=${type}` });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/profile/about' });
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      success: (res) => {
        if (!res.confirm) return;
        store.logout();
        wx.reLaunch({ url: '/pages/login/login' });
      }
    });
  }
});
