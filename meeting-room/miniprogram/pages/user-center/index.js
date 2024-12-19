const { envList } = require('../../envList');

// pages/me/index.js
Page({
  data: {
    username: '',
    avatar: '',
    open_id: '',
    title: '',
    hasUserInfo: false,
    userInfo: null
  },
  onLoad() {
    // 检查本地存储
    const user = wx.getStorageSync('userInfo');
    const openid = wx.getStorageSync('open_id');
    console.log('user', user);
    console.log('id', openid);
    if (user) {
      this.setData({
        username: user.nickName ? user.nickName : '微信用户',
        avatar: user.avatarUrl,
        open_id: openid,
        hasUserInfo: true,
        userInfo: user
      });
    }
  },

  gotoOrders() {
    wx.redirectTo({
      url: '/pages/orders/orders',
    });
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
          this.setData({ open_id: resp.result.openid });
          wx.hideLoading();
          wx.cloud.callFunction({
            name: 'add_user',
            data: {
              user_id: this.data.open_id,
              username: userInfo.nickName,
              avatar: userInfo.avatarUrl
            },
            success: () => {
              wx.setStorageSync('userInfo', {
                user_id: this.data.open_id,
                username: userInfo.nickName,
                avatar: userInfo.avatarUrl
              });
              wx.setStorageSync('open_id', this.data.open_id);
              this.setData({
                username: userInfo.nickName ? userInfo.nickName : '微信用户',
                avatar: userInfo.avatarUrl,
                hasUserInfo: true,
                userInfo: userInfo
              });
              wx.showToast({ title: '登录成功' });
            },
            fail: err => {
              console.error('登录失败', err);
              wx.showToast({ title: '登录失败', icon: 'error' });
            }
          });
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({ title: '获取用户信息失败', icon: 'error' });
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
    wx.removeStorageSync('open_id');
    this.setData({
      username: null,
      avatar: '',
      open_id: '',
      hasUserInfo: false,
      userInfo: null
    });
    wx.showToast({ title: '已退出登录' });
    wx.reLaunch({ url: this.route, });
  },

  // 新增方法：跳转到 orders 页面
  goToOrdersPage(e) {
    wx.reLaunch({
      url: `/pages/orders/orders`,
    });
  }
});
