const app = getApp();
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Component({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    isChoosingAvatar: false, // 新增状态
  },
  methods: {
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      });
    },
    onChooseAvatar(e) {
      // 防止多次点击
      if (this.data.isChoosingAvatar) return;
      this.setData({ isChoosingAvatar: true });
      const { avatarUrl } = e.detail;
      const { nickName } = this.data.userInfo;
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      });
      // 模拟异步操作结束，恢复按钮状态
      setTimeout(() => {
        this.setData({ isChoosingAvatar: false });
      }, 1000); // 假设1秒后操作结束
    },
    onInputChange(e) {
      const nickName = e.detail.value;
      const { avatarUrl } = this.data.userInfo;
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      });
    },
    getUserProfile() {
      wx.getUserProfile({
        desc: '展示用户信息',
        success: (res) => {
          console.log(res);
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          });
        }
      });
    },
    goToHome() {
      wx.switchTab({
        url: '/pages/home/home',
      });
    }
  },
});
