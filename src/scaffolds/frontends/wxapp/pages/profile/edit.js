const api = require('../../api/user');
const fileApi = require('../../api/file');
const store = require('../../utils/store');
const { resolveAvatar } = require('../../utils/util');

/**
 * 个人资料（二级页面）
 *
 * 头像：用 open-type="chooseAvatar" 让用户选微信头像（官方唯一可用的方式），
 *       拿到的是本地临时路径，必须上传到后端换成 /uploads 下的正式地址。
 * 昵称：input type="nickname"，微信会在键盘上方给出当前昵称供一键填入；
 *       真实昵称从 2022 年起不再允许静默读取。
 */
Page({
  data: {
    userInfo: {},
    avatarUrl: '',
    nickname: '',
    phone: '',
    email: '',
    uploading: false,
    loading: false
  },

  onShow() {
    const u = store.getUserInfo() || {};
    this.setData({
      userInfo: u,
      avatarUrl: resolveAvatar(u.avatar),
      nickname: u.nickname || '',
      phone: u.phone || '',
      email: u.email || ''
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  /** 选微信头像：先本地预览，再上传换正式地址 */
  async onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    const { userInfo } = this.data;
    if (!tempPath) return;
    if (!userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ uploading: true, avatarUrl: tempPath });
    try {
      const uploaded = await fileApi.uploadImage(tempPath);
      await api.updateUser({ id: userInfo.id, avatar: uploaded.url });
      const next = { ...userInfo, avatar: uploaded.url };
      store.updateUserInfo(next);
      this.setData({ userInfo: next, avatarUrl: resolveAvatar(uploaded.url) });
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } catch (err) {
      // 上传/保存失败：回滚到原头像，错误提示已由 api 层弹出
      this.setData({ avatarUrl: resolveAvatar(userInfo.avatar) });
    } finally {
      this.setData({ uploading: false });
    }
  },

  async handleSave() {
    const { userInfo, nickname, phone, email } = this.data;
    if (!userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
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
      // 错误已在 request 中提示
    } finally {
      this.setData({ loading: false });
    }
  }
});
