Page({
  data: {
    weekDates: [], // 存放周一到周日
    selectedDateIndex: 0, // 当前选中日期的索引

    timeSlots: [], // 时间段数据
    meetingRooms: ['1号会议室', '2号会议室', '3号会议室'], // 会议室列表
    selectedMeetingRoom: '1号会议室',

    selectedDate: '', // 选择的日期
    startTime: '08:00',
    endTime: '09:00',

    today: '', // 今天日期
    sevenDaysLater: '', // 7天后的日期
  },

  onLoad() {
    this.initWeekDates();
    this.initTimeSlots();
    this.setTodayAndSevenDaysLater();
  },

  // 初始化周一到周日
  initWeekDates() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const now = new Date();
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      weekDates.push({
        day: days[i],
        date: `${date.getMonth() + 1}-${date.getDate()}`,
      });
    }

    this.setData({
      weekDates,
      selectedDate: weekDates[0].date,
    });
  },

  // 设置时间段（每小时一段）
  initTimeSlots() {
    const timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      timeSlots.push({
        time: `${hour}:00--${hour + 1}:00`,
        selected: false,
      });
    }
    this.setData({ timeSlots });
  },

  // 设置今日和七天后的日期范围
  setTodayAndSevenDaysLater() {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    this.setData({
      today: now.toISOString().split('T')[0],
      sevenDaysLater: sevenDaysLater.toISOString().split('T')[0],
    });
  },

  // 选择日期
  onDateSelect(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      selectedDateIndex: index,
      selectedDate: this.data.weekDates[index].date,
    });
  },

  // 选择时间段（高亮/取消高亮）
  onTimeSlotSelect(e) {
    const { index } = e.currentTarget.dataset;
    const timeSlots = this.data.timeSlots;
    timeSlots[index].selected = !timeSlots[index].selected;
    this.setData({ timeSlots });
  },

  // 选择会议室
  onMeetingRoomChange(e) {
    this.setData({
      selectedMeetingRoom: this.data.meetingRooms[e.detail.value],
    });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value,
    });
  },

  // 自定义开始时间
  onStartTimeInput(e) {
    this.setData({ startTime: e.detail.value });
  },

  // 自定义结束时间
  onEndTimeInput(e) {
    this.setData({ endTime: e.detail.value });
  },

  // 确定按钮事件
  onConfirm() {
    const user = wx.getStorageSync('userInfo');
    if (!user) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            // 跳转到个人主页
            wx.switchTab({
              url: '/pages/user-center/index'
            });
          }
        }
      });
      return;
    }
    const selectedSlots = this.data.timeSlots
      .filter((slot) => slot.selected)
      .map((slot) => slot.time);
    wx.showModal({
      title: '预约确认',
      content: `会议室: ${this.data.selectedMeetingRoom}\n日期: ${this.data.selectedDate}\n时间段: ${selectedSlots.join(', ')}`,
      showCancel: true,
    })
    
    wx.cloud.callFunction({
      name: 'add_reservation',
      data: {
        user_id: this.data.userInfo.user_id,
        selectedSlots: this.data.selectedSlots
      },
      success: res => {
        wx.showToast({
          title: '预约成功',
          icon: 'success'
        });
      },
      fail: err => {
        console.error('预约失败', err);
        wx.showToast({
          title: '预约失败',
          icon: 'error'
        });
      }
    });
  },
});
