const { envList } = require('../../envList');

// pages/me/index.js
Page({
  data: {
    username: '',
    avatar: '',
    open_id: '',
    title:"",
  },
  onLoad() {
    // 检查本地存储
    const user = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('open_id');
    if (openid) {
      this.setData({
        username: user.nickName,
        avatar: user.avatar,
        open_id: openid
      });
    }
  },
  // 登录
  onLogin() {
    wx.getUserProfile({
      desc: '获取您的用户信息',
      success: (res) => {
        const userInfo = res.userInfo;
        wx.cloud.callFunction({
          name: 'get_openid',
        })
        .then((resp) => {
          this.setData({open_id: resp.result.openid});
          wx.hideLoading();
        });
        wx.cloud.callFunction({
          name: 'add_user',
          data: {
            user_id: this.data.open_id,
            username: userInfo.nickName,
            avatar: userInfo.avatarUrl
          },
          success: () => {
            wx.setStorageSync('userInfo', { user_id: this.data.open_id, username: userInfo.nickName, avatar: userInfo.avatarUrl });
            wx.setStorageSync('open_id', this.data.open_id);
            this.setData({
              userInfo: { user_id: this.data.open_id, username: userInfo.nickName, avatar: userInfo.avatarUrl }
            });
            wx.showToast({ title: '登录成功' });
          },
          fail: err => {
            console.error('登录失败', err);
            wx.showToast({ title: '登录失败', icon: 'error' });
          }
        });
      }
    });
  },
  gotoWxCodePage() {
    wx.navigateTo({
      url: `/pages/exampleDetail/index?envId=${envList?.[0]?.envId}&type=getMiniProgramCode`,
    });
  },
  onLogout() {
    wx.removeStorageSync('userInfo');
    wx.removeStorage('open_id');
    this.setData({
      username: '',
      avatar: '',
      open_id: ''
    });
    wx.showToast({ title: '已退出登录' });
  }
});
