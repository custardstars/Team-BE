// pages/booking/booking.ts
Page({
  data: {
    meetingRooms: ['会议室 1', '会议室 2', '会议室 3', '会议室 4', '会议室 5'], // 会议室选择项
    selectedRoom: '请选择会议室', // 默认显示的文本
  },

  // 返回上一页面
  goBack: function () {
    wx.navigateBack();
  },

  // 处理会议室选择事件
  onRoomChange: function (e: WechatMiniprogram.PickerChange) {
    const selectedIndex = Number(e.detail.value); // 将 e.detail.value 转为 number
    this.setData({
      selectedRoom: this.data.meetingRooms[selectedIndex]
    });
  },
});
