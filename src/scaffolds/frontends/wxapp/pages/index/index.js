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
    const avatarUrl = resolveAvatar(userInfo && userInfo.avatar);
    this.setData({ userInfo, avatarUrl });
    this.fetchNotices();
  },

  async fetchNotices() {
    try {
      // 首页只放最新 3 条，完整列表在「公告」tab
      const res = await noticeApi.pageQuery({ pageNum: 1, pageSize: 3 });
      this.setData({ list: res.data.records || [] });
    } catch (err) {
      // 未登录时忽略
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/notice/detail?id=${id}` });
  },

  goNoticeList() {
    wx.reLaunch({ url: '/pages/notice/list' });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
