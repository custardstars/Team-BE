Page({
  data: {
    weekDates: [], // 存放周一到周日
    selectedDateIndex: 0, // 当前选中日期的索引

    timeSlots: [], // 时间段数据
    meetingRooms:null, // 会议室列表
    selectedMeetingRoom:'',

    selectedDate: '', // 选择的日期

    today: '', // 今天日期
    sevenDaysLater: '', // 7天后的日期

    number: 2,
    numberOptions: [2,3,4,5,6],
    topic: '',
    phone: '',
  },
  onLoad() {
    this.initWeekDates();
    this.initTimeSlots();
    this.initRooms();
    this.setTodayAndSevenDaysLater();
    // this.fetchReservations(); // 加载时查询当前日期的预约情况
  },
  initRooms() {
    wx.cloud.callFunction({
      name: 'get_rooms', // 调用云函数
      success: res => {
        if (res.result.code === 200) {
          this.setData({
            meetingRooms: res.result.data,
            selectedMeetingRoom: res.result.data[0] || '', // 默认选中第一个会议室
          });
        } else {
          console.error('会议室列表获取失败', res.result.message);
        }
      },
      fail: err => {
        console.error('云函数调用失败', err);
      }
    });
  },

  fetchReservations() {
    wx.cloud.callFunction({
      name: 'check_reservation',
      data: {
        room_id: this.data.selectedMeetingRoom,
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

  // 更新时间段状态
  updateTimeSlots(reservations) {
    const open_id = wx.getStorageSync('open_id');
    const timeSlots = this.data.timeSlots.map(slot => {
      const reserved = reservations.find(r => r.time === slot.time);
      if (reserved) {
        slot.selected = false;
        slot.disabled = true;
        slot.color = reserved.user_id === open_id ? 'green' : 'red';
      } else {
        slot.disabled = false;
        slot.color = ''; // 重置颜色
      }
      return slot;
    });
    this.setData({ timeSlots });
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
  setTodayAndSevenDaysLater() {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 6);
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
    // }, () => {
    //   this.fetchReservations(); // 重新查询预约信息
    // });
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
  // 会议人数
  onNumberChange(e){
    this.setData({ 
      number: this.data.numberOptions[e.detail.value],
    });
  },
  // 会议主题
  onEndTimeInput(e) {
    this.setData({ topic: e.detail.value });
  },
  // 联系方式
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
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
            wx.switchTab({url: '/pages/user-center/index'});
          }
        }
      });
      return;
    }
    const selectedSlots = this.data.timeSlots
      .filter((slot) => slot.selected)
      .map((slot) => slot.time);
    if(selectedSlots.length==0){
      wx.showModal({
        title: '提示',
        content: '未选择需要预约的时间',
        showCancel:false,
      });
      return;
    }
    wx.showModal({
      title: '预约确认',
      content: `会议室: ${this.data.selectedMeetingRoom}\n日期: ${this.data.selectedDate}\n时间段: ${selectedSlots.join(', ')}`,
      showCancel: true,
    })
    
    wx.cloud.callFunction({
      name: 'add_reservation',
      data: {
        user_id: open_id,
        selectedSlots: selectedSlots,
        room_id: this.data.selectedMeetingRoom,
        date: this.data.selectedDate
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
