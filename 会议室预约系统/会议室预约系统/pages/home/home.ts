// pages/home/home.ts
Page({
  goBack() {
    wx.navigateBack();  // 调用微信小程序自带的返回功能
  },
  
  data: {
    // 时间段列
    timeSlots: [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
      '20:00-21:00', '21:00-22:00'
    ],

    // 会议室状态
    rooms: [
      {
        name: '会议室 1',
        status: Array(14).fill({ color: '#ccffcc', time: '' })
      },
      {
        name: '会议室 2',
        status: Array(14).fill({ color: '#ccffcc', time: '' })
      },
      {
        name: '会议室 3',
        status: [
          ...Array(5).fill({ color: '#ccffcc', time: '' }),
          { color: '#ccccff', time: '预约成功' }, // 13:00--14:00
          ...Array(8).fill({ color: '#ccffcc', time: '' })
        ]
      },
      {
        name: '会议室 4',
        status: Array(14).fill({ color: '#ccffcc', time: '' })
      },
      {
        name: '会议室 5',
        status: [
          { color: '#ffcccc', time: '已被预约' }, // 8:00--9:00
          { color: '#ffcccc', time: '已被预约' }, // 9:00--10:00
          ...Array(12).fill({ color: '#ccffcc', time: '' })
        ]
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})