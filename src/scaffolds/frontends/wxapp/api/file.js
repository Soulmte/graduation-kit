const { BASE_URL } = require('../config/index');

/**
 * 上传图片（头像）
 *
 * 小程序的本地文件只能用 wx.uploadFile 传，不能走 wx.request；
 * 字段名必须和后端 @RequestParam("file") 对上。
 *
 * @param {string} filePath 本地临时路径，来自 chooseAvatar / chooseMedia
 * @returns {Promise<{url: string, fileName: string}>} url 形如 /uploads/2026-10-29/xxx.png
 */
const uploadImage = (filePath) =>
  new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: `${BASE_URL}/file/upload`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        let body;
        try {
          body = JSON.parse(res.data);
        } catch (e) {
          wx.showToast({ title: '上传返回解析失败', icon: 'none' });
          reject(new Error('上传返回解析失败'));
          return;
        }
        if (body.code === 200) {
          resolve(body.data);
          return;
        }
        if (body.code === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/login/login' });
        }
        wx.showToast({ title: body.message || '上传失败', icon: 'none' });
        reject(new Error(body.message || '上传失败'));
      },
      fail(err) {
        wx.showToast({ title: '上传失败，请检查网络', icon: 'none' });
        reject(err);
      }
    });
  });

module.exports = { uploadImage };
