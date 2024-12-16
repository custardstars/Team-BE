Page({
  data: {
    wx_name: '',
    avatar: '',
    signature: ''
  },
  onLoad() {
    const userInfo = wx.getStorageSync('user_info');
    if (userInfo) {
      this.setData({
        avatar: userInfo.avatar,
        username: userInfo.username,
        signature: userInfo.signature || '这位用户还没有签名',
      });
    }
  },

  // 修改签名
  onSignatureInput(e) {
    this.setData({
      signature: e.detail.value
    });
  },

  // 保存签名
  onSaveSignature() {
    const { signature } = this.data;
    const userInfo = wx.getStorageSync('user_info');
    if (userInfo) {
      wx.cloud.callFunction({
        name: 'updateSignature',
        data: {
          user_id: userInfo._id,
          signature,
        },
        success: res => {
          wx.showToast({ title: '签名保存成功' });
          // 更新本地缓存
          userInfo.signature = signature;
          wx.setStorageSync('user_info', userInfo);
        },
        fail: err => {
          wx.showToast({ title: '签名保存失败', icon: 'none' });
          console.error('签名保存失败', err);
        },
      });
    }
  },
});