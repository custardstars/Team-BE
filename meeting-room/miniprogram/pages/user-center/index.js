const { envList } = require('../../envList');

// pages/me/index.js
Page({
  data: {
    userInfo: null,
    openId: '',
    showTip: false,
    title:"",
    content:""
  },
  onLoad() {
    // 检查本地存储
    const user = wx.getStorageSync('userInfo');
    if (user) {
      this.setData({
        isLoggedIn: true,
        userInfo: user
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
          this.setData({
            openId: resp.result.openid,
          });
          wx.hideLoading();
        });
        wx.cloud.callFunction({
          name: 'add_user',
          data: {
            // user_id: openId,
            user_id: 'aaa',
            username: userInfo.nickName,
            avatar: userInfo.avatarUrl
          },
          success: () => {
            wx.setStorageSync('userInfo', { user_id: 'aa', username: userInfo.nickName, avatar: userInfo.avatarUrl });
            this.setData({
              isLoggedIn: true,
              userInfo: { user_id: 'aaa', username: userInfo.nickName, avatar: userInfo.avatarUrl }
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
    this.setData({
      isLoggedIn: false,
      userInfo: null,
      openId: ''
    });
    wx.showToast({ title: '已退出登录' });
  }
});
