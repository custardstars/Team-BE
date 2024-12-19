Page({
  data: {
    weekDates: [],
    selectedDateIndex: 0,
    timeSlots: [],
    meetingRooms: [
      '教书院226',
      '教书院118',
      '理科大楼B226',
      '文史楼107',
      '文附楼305'
    ],
    selectedMeetingRoom: '教书院226', 
    selectedDate: '',
    showModal: false, // 是否显示弹出窗口
    currentSlot: null, // 当前选中的时间段
  },

  onLoad() {
    this.initWeekDates();
    this.initTimeSlots();
    this.fetchReservations(); // 加载时查询当前日期的预约情况
  },

  // 初始化周一到周日
  initWeekDates() {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const now = new Date();
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      weekDates.push({
        day: days[date.getDay()],
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
        free: 0,
        occupied: 0,
        freeRooms: [],
        occupiedRooms: []
      });
    }
    this.setData({ timeSlots });
  },
  // 选择日期
  onDateSelect(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      selectedDateIndex: index,
      selectedDate: this.data.weekDates[index].date,
    }, () => {
      this.fetchReservations(); // 重新查询预约信息
    });
  },

// 选择时间段（显示弹出窗口）
onTimeSlotSelect(e) {
  const { index } = e.currentTarget.dataset;
  const timeSlots = this.data.timeSlots;
  this.setData({
    showModal: true, // 显示弹出窗口
    currentSlot: timeSlots[index]
  });
},

// 新增方法：跳转到booking页面
goToBookingPage(e) {
  const { room } = e.currentTarget.dataset;
  const { selectedDate, currentSlot } = this.data;
  wx.reLaunch({
    url: `/pages/booking/booking?date=${selectedDate}&timeSlot=${currentSlot.time}&room=${room}`,
  });
  this.closeModal();
},


  fetchReservations() {
    wx.cloud.callFunction({
      name: 'check_reservation',
      data: {
        date: this.data.selectedDate
      },
      success: res => {
        if (res.result.code === 200) {
          this.updateTimeSlots(res.result.data);
        } else {
          console.error('预约查询失败', res.result.message);
        }
      },
      fail: err => {
        console.error('云函数调用失败', err);
      }
    });
  },

  // 根据预约数据更新时间段状态
  updateTimeSlots(reservations) {
    const meetingRooms = this.data.meetingRooms;
    const timeSlots = this.data.timeSlots.map(slot => {
      const occupiedRooms = reservations.filter(r => r.slot_id === slot.time).map(r => r.room_id);
      const freeRooms = meetingRooms.filter(room => !occupiedRooms.includes(room));
      return {
        ...slot,
        free: freeRooms.length,
        occupied: occupiedRooms.length,
        status: `空闲 ${freeRooms.length}, 占用 ${occupiedRooms.length}`,
        freeRooms: freeRooms,
        occupiedRooms: occupiedRooms
      };
    });
    this.setData({ timeSlots });
  },

  // 关闭弹出窗口
  closeModal() {
    this.setData({
      showModal: false,
      currentSlot: null
    });
  },
});
