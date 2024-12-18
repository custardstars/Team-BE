// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
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
