const noticeApi = require('../../api/notice');
const store = require('../../utils/store');
const { resolveAvatar } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    list: [],
    avatarUrl: ''
  },

  onShow() {
    const userInfo = store.getUserInfo();
    const avatarUrl = resolveAvatar(userInfo?.avatar);
    this.setData({ userInfo, avatarUrl });
    this.fetchNotices();
  },

  async fetchNotices() {
    try {
      const res = await noticeApi.pageQuery({ pageNum: 1, pageSize: 20 });
      this.setData({ list: res.data.records });
    } catch (err) {
      // 未登录时忽略
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/notice/notice?id=${id}` });
  },

  handleLogout() {
    store.logout();
    this.setData({ userInfo: null });
    wx.showToast({ title: '已退出', icon: 'none' });
  }
});
