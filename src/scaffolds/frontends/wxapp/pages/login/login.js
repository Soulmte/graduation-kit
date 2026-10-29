const api = require('../../api/user');
const store = require('../../utils/store');

/** wx.login 的回调版包成 Promise */
const getLoginCode = () =>
  new Promise((resolve, reject) => {
    wx.login({
      success: (res) => (res.code ? resolve(res.code) : reject(new Error('未取到登录 code'))),
      fail: reject
    });
  });

Page({
  data: {
    // wx：微信一键登录；pwd：账号密码登录。两种方式切换展示，不同时出现
    mode: 'wx',
    username: '',
    password: '',
    loading: false,
    wxLoading: false
  },

  onModeChange(e) {
    this.setData({ mode: e.detail.value });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  /** 微信一键登录：wx.login 拿 code → 后端换 openid → 返回 token */
  async handleWxLogin() {
    if (this.data.wxLoading) return;
    this.setData({ wxLoading: true });
    try {
      const code = await getLoginCode();
      const res = await api.wxLogin(code);
      store.setAuth(res.data.token, res.data.userInfo);
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' });
      }, 600);
    } catch (err) {
      // 错误已在 request 中提示
    } finally {
      this.setData({ wxLoading: false });
    }
  },

  /** 账号密码登录：给管理员/测试账号用 */
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
      }, 600);
    } catch (err) {
      // 错误已在 request 中提示
    } finally {
      this.setData({ loading: false });
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
