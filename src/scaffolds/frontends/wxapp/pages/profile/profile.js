const api = require('../../api/user');
const store = require('../../utils/store');
const { resolveAvatar } = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    avatar: '',
    avatarUrl: '',
    nickname: '',
    phone: '',
    email: '',
    loading: false,
    pwdVisible: false,
    pwdLoading: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  },

  onShow() {
    const u = store.getUserInfo() || {};
    const avatarUrl = resolveAvatar(u.avatar);
    this.setData({
      userInfo: u,
      avatar: u.avatar || '',
      avatarUrl,
      nickname: u.nickname || '',
      phone: u.phone || '',
      email: u.email || ''
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async handleSave() {
    const { userInfo, nickname, phone, email } = this.data;
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: '邮箱格式不正确', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      await api.updateUser({ id: userInfo.id, nickname, phone, email });
      // updateUserInfo 是整体覆盖，要传合并后的完整对象
      const next = { ...userInfo, nickname, phone, email };
      store.updateUserInfo(next);
      this.setData({ userInfo: next });
      wx.showToast({ title: '更新成功', icon: 'success' });
    } catch (err) {
      // 错误已在 request 中处理
    } finally {
      this.setData({ loading: false });
    }
  },

  openPwd() {
    this.setData({ pwdVisible: true });
  },

  closePwd() {
    this.setData({
      pwdVisible: false,
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  },

  // 拦截弹窗内的点击，避免冒泡到遮罩把弹窗关掉
  noop() {},

  onPwdInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async handleUpdatePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data;
    if (!oldPassword || !newPassword) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      wx.showToast({ title: '新密码长度 6-20 位', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }

    this.setData({ pwdLoading: true });
    try {
      await api.updatePassword(oldPassword, newPassword);
      wx.showToast({ title: '修改成功', icon: 'success' });
      this.closePwd();
    } catch (err) {
      // 错误已在 request 中处理
    } finally {
      this.setData({ pwdLoading: false });
    }
  }
});
