Page({
  data: {
    weekDates: [], // 存放周一到周日的数据
    selectedDateIndex: 0, // 选中的日期索引
    timeSlots: [], // 时间段数据
  },

  onLoad() {
    this.initWeekDates();
    this.initTimeSlots();
  },

  // 初始化周一到周日的日期
  initWeekDates() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weekDates = [];
    const now = new Date();

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
    });
  },

  // 初始化时间段数据（每个小时占一行）
  initTimeSlots() {
    const timeSlots = [];
    const startHour = 8; // 从 8:00 开始
    const endHour = 20; // 到 18:00 结束

    for (let hour = startHour; hour < endHour; hour++) {
      timeSlots.push({
        time: `${hour}:00 -- ${hour + 1}:00`,
        status: '空闲',
      });
    }

    this.setData({
      timeSlots,
    });
  },

  // 选择日期
  onDateSelect(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      selectedDateIndex: index,
    });
  },

  // 选择时间段并跳转到 booking 页面
  onTimeSlotSelect(e) {
    const { time } = e.currentTarget.dataset;
    const selectedDate = this.data.weekDates[this.data.selectedDateIndex];

    wx.navigateTo({
      url: `/pages/booking/booking?date=${selectedDate.date}&time=${time}`,
    });
  },
});
