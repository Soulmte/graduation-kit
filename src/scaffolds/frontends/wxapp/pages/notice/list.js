const api = require('../../api/notice');

Page({
  data: {
    list: [],
    loading: true
  },

  onShow() {
    this.fetch();
  },

  onPullDownRefresh() {
    this.fetch();
  },

  async fetch() {
    this.setData({ loading: true });
    try {
      const res = await api.pageQuery({ pageNum: 1, pageSize: 20 });
      this.setData({ list: res.data.records || [] });
    } catch (err) {
      // 未登录或网络异常时，错误提示已由 request 统一处理
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/notice/detail?id=${id}` });
  }
});
