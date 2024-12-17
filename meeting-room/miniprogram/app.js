// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: "",
        traceUser: true,
      });

      // 以下为注释掉调用云函数生成时间段的部分
      // const dates = [];
      // let currentDate = new Date('2024-12-17');
      // const endDate = new Date('2024-12-31');

      // while (currentDate <= endDate) {
      //   dates.push(currentDate.toISOString().split('T')[0]);
      //   const newDate = new Date(currentDate);
      //   currentDate.setDate(newDate.getDate() + 1);
      // }

      // let slotId = 1;
      // for (let date of dates) {
      //   wx.cloud.callFunction({
      //     name: 'generateTimeSlots',
      //     data: {
      //       date: date,
      //       startSlotId: slotId
      //     },
      //     success: function (res) {
      //       console.log(res.result.message);
      //     },
      //     fail: console.error
      //   });
      //   slotId += 12;
      // }
    }

    this.globalData = {};
  }
});
