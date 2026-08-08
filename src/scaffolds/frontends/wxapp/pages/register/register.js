const api = require('../../api/user');

Page({
  data: {
    username: '',
    password: '',
    confirm: '',
    nickname: '',
    phone: '',
    email: '',
    loading: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async handleRegister() {
    const { username, password, confirm, nickname, phone, email } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '用户名和密码不能为空', icon: 'none' });
      return;
    }
    if (username.length < 3 || username.length > 50) {
      wx.showToast({ title: '用户名长度3-50个字符', icon: 'none' });
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      wx.showToast({ title: '用户名需以字母开头', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }
    if (password !== confirm) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      await api.register({ username, password, nickname, phone, email });
      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      // 错误已在 request 中处理
    } finally {
      this.setData({ loading: false });
    }
  }
});
