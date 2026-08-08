const api = require('../../api/user');
const store = require('../../utils/store');

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async handleLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.login(username, password);
      store.setAuth(res.data.token, res.data.userInfo);
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' });
      }, 1000);
    } catch (err) {
      // 错误已在 request 中处理
    } finally {
      this.setData({ loading: false });
    }
  }
});
