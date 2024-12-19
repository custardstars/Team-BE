Page({
  data: {
    weekDates: [], // 存放周一到周日
    selectedDateIndex: 0, // 当前选中日期的索引

    timeSlots: [], // 时间段数据
    meetingRooms: null, // 会议室列表
    selectedMeetingRoom: '',

    selectedDate: '', // 选择的日期
    meetingRoomSelected: false,

    number: 2,
    numberOptions: [2, 3, 4, 5, 6],
    topic: '',
    phone: '',
    reserveOrSubscribe: '预约',
  },

  onLoad(options) {
    this.initWeekDates();
    this.initTimeSlots();
    this.initRooms();
    console.log('onLoad invoked'); // 日志确认onLoad方法是否被调用
    
    // 接收传递的参数
    const { date, timeSlot, room } = options;
      this.setData({
      selectedDate: date,
      selectedTimeSlot: timeSlot,
      selectedMeetingRoom: room,
    });
    if(date && room && timeSlot){
      for(let i=0;i<7;i++){
        if(this.data.weekDates[i].date === date){
          this.setData({selectedDateIndex:i});
        }
      }
      const timeSlots = this.data.timeSlots.map(slot => {
        if(slot.time==timeSlot){
          slot.selected=true;
          slot.status='selected';
        }
        return slot;
      });
      this.setData({ 
        timeSlots,
        meetingRoomSelected: true,
      });
    }    
    this.fetchReservations();
  },
 
  initRooms() {
    wx.cloud.callFunction({
      name: 'get_rooms',
      success: res => {
        if (res.result.code === 200) {
          this.setData({
            meetingRooms: res.result.data,
          });
        } else {console.error('会议室列表获取失败', res.result.message);}
      },
      fail: err => {console.error('云函数调用失败', err);}
    });
  },
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

  // 获取数据库中当前日期、会议室下，被预约的时间段
  fetchReservations() {
    if(this.data.meetingRoomSelected==false){
      this.resetTimeSlotsSelection();
      this.updateTimeSlots([]);
      return;
    }
    const open_id = wx.getStorageSync('open_id');
    wx.cloud.callFunction({
      name: 'check_reservation',
      data: {
        room_id: this.data.selectedMeetingRoom,
        date: this.data.selectedDate
      },
      success: res => {
        if (res.result.code === 200) {
          this.updateTimeSlots(res.result.data);
        } else {console.error('预约查询失败', res.result.message);}
      },
      fail: err => {console.error('云函数调用失败', err);}
    });
    wx.cloud.callFunction({
      name: 'get_subscribe',
      data: {
        room_id: this.data.selectedMeetingRoom,
        date: this.data.selectedDate,
        user_id: open_id,
      },
      success: res => {
        if (res.result.code === 200) {
          this.updateSubscribe(res.result.data);
        } 
        else {console.error('预约查询失败', res.result.message);}
      },
      fail: err => {console.error('云函数调用失败', err);}
    });
  },
  // 更新时间段状态
  updateTimeSlots(reservations) {
    const open_id = wx.getStorageSync('open_id');
    const timeSlots = this.data.timeSlots.map(slot => {
      const reserved = reservations.find(r => r.slot_id === slot.time);
      if (reserved) {
        if(reserved.user_id === open_id){
          slot.status = 'reserved';
        }
        else if(slot.selected) slot.status = 'disabled-selected';
        else slot.status = 'disabled';
      }
      else {
        if(slot.selected) slot.status = 'selected';
        else slot.status = '';
      }
      return slot;
    });
    this.setData({ timeSlots });
  },
  updateSubscribe(subscriptions) {
    const timeSlots = this.data.timeSlots.map(slot => {
      if (subscriptions.find(r => r.slot_id === slot.time)) {
        slot.status = 'subscribed';
      }
      return slot;
    });
    this.setData({ timeSlots });
  },

  // 选择日期
  onDateSelect(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      selectedDateIndex: index,
      selectedDate: this.data.weekDates[index].date,
    }, () => {
      this.resetTimeSlotsSelection();
      this.fetchReservations(); // 重新查询预约信息
    });
  },

  // 选择时间段（高亮/取消高亮）
  onTimeSlotSelect(e) {
    // 未选择会议室
    if(!this.data.meetingRoomSelected){
      wx.showModal({
        title: '提示',
        content: '请选择要预约的会议室',
        showCancel: false,
      });
      return;
    }
    const { index } = e.currentTarget.dataset;
    const timeSlots = this.data.timeSlots;
    const currentSlot = timeSlots[index];
    if(currentSlot.status === 'reserved' || currentSlot.status == 'subscribed')return;
    if(!currentSlot.selected){
      if(currentSlot.status === ''){
        if(timeSlots.some(slot => slot.status==='disabled-selected'))return;
      }
      if(currentSlot.status == 'disabled'){
        if(timeSlots.some(slot => slot.status==='selected'))return;
      }
    }
    timeSlots[index].selected = !timeSlots[index].selected;
    if(timeSlots[index].status=='')timeSlots[index].status='selected';
    else if(timeSlots[index].status=='selected')timeSlots[index].status='';
    else if(timeSlots[index].status=='disabled')timeSlots[index].status='disabled-selected';
    else if(timeSlots[index].status=='disabled-selected')timeSlots[index].status='disabled';
    this.setData({ timeSlots });
    const selectedSlots = this.data.timeSlots
      .filter((slot) => slot.selected)
      .map((slot) => slot.time);
    if(selectedSlots.length==0 || selectedSlots[0].status=='selected'){
      this.reserveOrSubscribe='预约';
    }
    else{
      this.reserveOrSubscribe='订阅';
    }
  },

  // 选择会议室
  onMeetingRoomChange(e) {
    this.setData({
      selectedMeetingRoom: this.data.meetingRooms[e.detail.value],
      meetingRoomSelected:true,
    }, () => {
      this.resetTimeSlotsSelection();
      this.fetchReservations();
    });
  },
  // 重置时间段状态
  resetTimeSlotsSelection() {
    const timeSlots = this.data.timeSlots.map(slot => {
      slot.selected = false; // 重置为未选中状态
      if(slot.status=='selected')slot.status='';
      if(slot.status=='disabled-selected')slot.status='disabled';
      return slot;
    });
    this.setData({ 
      timeSlots,
      reserveOrSubscribe: '预约',
    });
  },
  // 会议人数
  onNumberChange(e) {
    this.setData({
      number: this.data.numberOptions[e.detail.value],
    });
  },
  // 会议主题
  onTopicInput(e) {
    this.setData({ topic: e.detail.value });
  },
  // 联系方式
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 确定按钮事件
  onConfirm() {
    const open_id = wx.getStorageSync('open_id');
    if (!open_id || open_id.length == 0) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user-center/index' });
          }
        },
      });
      return;
    }
    const selectedSlots = this.data.timeSlots.filter((slot) => slot.selected);
    // 未选择时间
    if (selectedSlots.length == 0) {
      wx.showModal({
        title: '提示',
        content: '未选择需要预约的时间',
        showCancel: false,
      });
      return;
    }
    // 会议主题为空
    if(!this.data.topic || this.data.topic==''){
      wx.showModal({
        title: '提示',
        content: '请输入会议主题',
        showCancel: false,
      });
      return;
    }
    // 手机号为空
    if(!this.data.phone || this.data.phone==''){
      wx.showModal({
        title: '提示',
        content: '请输入联系方式',
        showCancel: false,
      });
      return;
    }
    const time_slots = this.data.timeSlots
    .filter((slot) => slot.selected)
    .map((slot) => slot.time);
    // 预约
    if(selectedSlots[0].status == 'selected'){
      wx.showModal({
        title: '预约确认',
        content: `会议室: ${this.data.selectedMeetingRoom}\n日期: ${this.data.selectedDate}\n时间段: ${selectedSlots.map((slot) => slot.time).join(', ')}`,
        showCancel: true,
        success: (res) => {
          if (res.confirm) {
            // 发送预约请求
            wx.cloud.callFunction({
              name: 'add_reservation',
              data: {
                user_id: open_id,
                selectedSlots: time_slots,
                room_id: this.data.selectedMeetingRoom,
                date: this.data.selectedDate,
                phone: this.data.phone,
                number: this.data.number,
                topic: this.data.topic
              },
              success: (res) => {
                wx.showToast({
                  title: '预约成功',
                  icon: 'success',
                });
                // wx.navigateBack();
              },
              fail: (err) => {
                console.error('预约失败', err);
                wx.showToast({
                  title: '预约失败',
                  icon: 'error',
                });
              },
            });
            this.fetchReservations();
          }
        },
      });
    }
    // 订阅
    else{
      wx.showModal({
        title: '订阅确认',
        content: `会议室: ${this.data.selectedMeetingRoom}\n日期: ${this.data.selectedDate}\n时间段: ${selectedSlots.map((slot) => slot.time).join(', ')}`,
        showCancel: true,
        success: (res) => {
          if (res.confirm) {
            wx.cloud.callFunction({
              name: 'add_subscribe',
              data: {
                user_id: open_id,
                selectedSlots: time_slots,
                room_id: this.data.selectedMeetingRoom,
                date: this.data.selectedDate,
                phone: this.data.phone,
                number: this.data.number,
                topic: this.data.topic
              },
              success: (res) => {
                wx.showToast({
                  title: '订阅成功',
                  icon: 'success',
                });
                // wx.navigateBack();
              },
              fail: (err) => {
                console.error('订阅失败', err);
                wx.showToast({
                  title: '订阅失败',
                  icon: 'error',
                });
              },
            });
            this.fetchReservations();
          }
        },
      });
    }
  },
});
