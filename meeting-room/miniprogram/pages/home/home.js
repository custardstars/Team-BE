Page({
  data: {
    weekDates: [], // 存放周一到周日
    selectedDateIndex: 0, // 当前选中日期的索引
    timeSlots: [], // 时间段数据
    meetingRooms: [
      '教书院226',
      '教书院118',
      '理科大楼B226',
      '文史楼107',
      '文附楼305'
    ], // 会议室列表
    selectedMeetingRoom: '教书院226', // 默认选中第一个会议室
    selectedDate: '', // 选择的日期
    today: '', // 今天日期
    sevenDaysLater: '', // 7天后的日期
    showModal: false, // 是否显示弹出窗口
    currentSlot: null, // 当前选中的时间段
  },

  onLoad() {
    this.initWeekDates();
    this.initTimeSlots();
    this.setTodayAndSevenDaysLater();
    this.fetchReservations(); // 加载时查询当前日期的预约情况
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
        status: '可预定', // 默认状态为可预定
        free: 0,   // 空闲会议室数量
        occupied: 0, // 占用会议室数量
        freeRooms: [], // 空闲会议室列表
        occupiedRooms: [] // 占用会议室列表
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

  // 防止点击弹出窗口内部时关闭窗口
  preventClose(e) {
    e.stopPropagation();
  },

  // 确定按钮事件
  onConfirm() {
    const open_id = wx.getStorageSync('open_id');
    if (!open_id) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user-center/index' });
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
    });

    wx.cloud.callFunction({
      name: 'add_reservation',
      data: {
        user_id: open_id,
        selectedSlots: selectedSlots,
        meetingRoom: this.data.selectedMeetingRoom,
        date: this.data.selectedDate,
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
