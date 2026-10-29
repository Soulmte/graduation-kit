const api = require('../../api/user');
const store = require('../../utils/store');

/**
 * 修改密码（二级页面）
 * 改完统一退出登录，逼着用户用新密码再登一次
 */
Page({
  data: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async handleSubmit() {
    const { oldPassword, newPassword, confirmPassword } = this.data;
    if (!oldPassword) {
      wx.showToast({ title: '请输入原密码', icon: 'none' });
      return;
    }
    if (!newPassword) {
      wx.showToast({ title: '请输入新密码', icon: 'none' });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      wx.showToast({ title: '新密码长度 6-20 位', icon: 'none' });
      return;
    }
    if (newPassword === oldPassword) {
      wx.showToast({ title: '新密码不能与原密码相同', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      await api.updatePassword(oldPassword, newPassword);
      wx.showToast({ title: '密码已修改', icon: 'success' });
      store.logout();
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/login' });
      }, 800);
    } catch (err) {
      // 原密码错误等提示由 request 统一弹出
    } finally {
      this.setData({ loading: false });
    }
  }
});
