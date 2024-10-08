// pages/profile/profile.ts
Page({
  data: {
    // avatarUrl: '/path/to/default-avatar.png', // 默认头像路径
    signature: '这是我的个人签名', // 默认签名
  },

  // 返回到上一页面
  goBack: function () {
    wx.navigateBack();
  },
});
