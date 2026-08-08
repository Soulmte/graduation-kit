const api = require('../../api/notice');

Page({
  data: {
    detail: null,
    loading: true
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      api.getById(id).then(res => {
        this.setData({ detail: res.data });
      }).finally(() => {
        this.setData({ loading: false });
      });
    }
  }
});
