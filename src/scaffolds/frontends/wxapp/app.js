const store = require('./utils/store');

App({
  globalData: {
    token: '',
    userInfo: null
  },

  onLaunch() {
    const token = store.getToken();
    const userInfo = store.getUserInfo();
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  }
});
