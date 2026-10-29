/**
 * 自定义底部导航
 *
 * 不用 app.json 的原生 tabBar：原生栏改不了圆角、字号和选中态，
 * 也没法和 TDesign 的主题色统一。这里自己画一条，页面末尾引入即可：
 *   <tab-bar active="home" />
 * 组件内部自带等高占位块，fixed 定位不会盖住页面内容。
 */
Component({
  properties: {
    /** 当前页：home / notice / profile */
    active: { type: String, value: 'home' }
  },

  data: {
    list: [
      { key: 'home', text: '首页', icon: 'home', url: '/pages/index/index' },
      { key: 'notice', text: '公告', icon: 'notification', url: '/pages/notice/list' },
      { key: 'profile', text: '我的', icon: 'user', url: '/pages/profile/profile' }
    ]
  },

  methods: {
    onTap(e) {
      const { key, url } = e.currentTarget.dataset;
      if (key === this.data.active) return;
      wx.reLaunch({ url });
    }
  }
});
