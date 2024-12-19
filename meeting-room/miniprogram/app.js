// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "", // 在此填写你的云开发环境ID
        traceUser: true,
      });

      // 调用云函数 checkReservations
      wx.cloud.callFunction({
        name: 'check_2_tables',
        success: (res) => {
          console.log('check2tables result:', res);
        },
        fail: (err) => {
          console.error('check2tables error:', err);
        }
      });
    }
    this.globalData = {};
  }
});
