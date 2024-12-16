Page({
  data: {
    isLoggedIn: false,      // 是否登录
    avatar: '',             // 头像
    username: '',           // 用户名
  },

  logIn() {
    wx.switchTab({
      url: '/pages/home/home',
    })
  },
  onLoad() {
    // 检查用户是否已经登录
    const userInfo = wx.getStorageSync('user_info');
    if (userInfo) {
      // 如果用户信息存在，说明已经登录过
      this.setData({
        isLoggedIn: true,
        avatar: userInfo.avatar,
        username: userInfo.username || '',
      });
    }
  },

  // 获取微信用户信息
  onGetUserInfo(e) {
    const { userInfo } = e.detail;
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        avatar: userInfo.avatarUrl,
        username: userInfo.nickName,  // 默认使用微信昵称
      });
      // 保存用户信息到本地存储
      wx.setStorageSync('user_info', {
        avatar: userInfo.avatarUrl,
        username: userInfo.nickName,
      });
    }
  },

  // 用户自定义输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 提交用户信息（保存到云数据库）
  onSubmit() {
    const { avatar, username } = this.data;
    if (!username) {
      wx.showToast({ title: '用户名不能为空', icon: 'none' });
      return;
    }
    
    // 将用户名和头像保存到云数据库
    wx.cloud.callFunction({
      name: 'addUser',
      data: {
        avatar,
        username,
      },
      success: res => {
        wx.showToast({ title: '提交成功' });
        // 保存到本地缓存
        wx.setStorageSync('user_info', {
          avatar,
          username,
        });
        wx.switchTab({
          url: '/pages/home/home',
        });
      },
      fail: err => {
        wx.showToast({ title: '提交失败', icon: 'none' });
        console.error('提交失败', err);
      },
    });
  },
});
