Page({
  data: {
    wx_name: '',
    avatar: '',
    signature: ''
  },
  onLoad() {
    const userId = wx.getStorageSync('user_id');
    wx.cloud.callFunction({
      name: 'getUserProfile',
      data: { user_id: userId },
      success: res => {
        this.setData({
          wx_name: res.result.wx_name,
          avatar: res.result.avatar,
          signature: res.result.signature
        });
      }
    });
  }
});