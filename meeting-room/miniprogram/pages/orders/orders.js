Page({
  data: {
    allOrders: [],          // 全部订单
    reservedOrders: [],     // 已预约订单
    completedOrders: [],    // 已完成订单
    subscribedOrders: [],   // 已订阅订单
    selectedTab: 'all',     // 当前选中的订单标签
    currentOrders: [],      // 当前显示的订单列表
  },
  onLoad() {
    this.fetchOrders();  // 加载数据时调用
  },
  onShow() {
    this.fetchOrders();  // 每次页面显示时都刷新数据
  },
  // 时间格式化函数（将时间戳格式化为你希望的格式）
  formatReserveTime(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleString('zh-CN', options);
  },

  // 合并连续时间段的函数
  mergeConsecutiveOrders(orders) {
    const mergedOrders = [];
    // 按照房间和日期排序，确保合并顺序
    orders.sort((a, b) => a.room_id.localeCompare(b.room_id) || a.date.localeCompare(b.date) || a.slot_id.localeCompare(b.slot_id));

    let currentOrder = null;
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (currentOrder === null) {
        currentOrder = { ...order };
      } else {
        // 判断当前记录与前一条记录的时间段是否连续
        const currentSlotEndTime = this.getEndTime(currentOrder.slot_id);
        const nextSlotStartTime = this.getStartTime(order.slot_id);
        
        // 如果连续，则合并
        if (this.isConsecutive(currentSlotEndTime, nextSlotStartTime)) {
          currentOrder.slot_id = `${currentOrder.slot_id.split('--')[0]}--${order.slot_id.split('--')[1]}`;
        } else {
          mergedOrders.push(currentOrder);
          currentOrder = { ...order };
        }
      }
    }
    
    // 将最后一个订单加入
    if (currentOrder !== null) {
      mergedOrders.push(currentOrder);
    }

    return mergedOrders;
  },

  // 判断两个时间段是否是连续的
  isConsecutive(endTime, startTime) {
    return new Date(endTime).getTime() === new Date(startTime).getTime();
  },

  // 获取时间段结束时间
  getEndTime(slot_id) {
    const times = slot_id.split('--');
    const [hour, minute] = times[1].split(':');
    const endTime = new Date();
    endTime.setHours(hour, minute, 0);
    return endTime;
  },

  // 获取时间段开始时间
  getStartTime(slot_id) {
    const times = slot_id.split('--');
    const [hour, minute] = times[0].split(':');
    const startTime = new Date();
    startTime.setHours(hour, minute, 0);
    return startTime;
  },

  // 获取订单列表
  async fetchOrders() {
    const open_id = wx.getStorageSync('open_id');
    if (!open_id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }
    try {
      // 调用云函数获取预约记录
      const res = await wx.cloud.callFunction({
        name: 'getRecords',  // 云函数名称
        data: { open_id },    // 传递 open_id 给云函数
      });
      // 如果查询成功，格式化数据并显示
      if (res.result.success) {
        const allOrders = res.result.data.map(order => ({
          room_id: order.room_id,
          date: order.date,
          slot_id: order.slot_id,
          reserve_time: this.formatReserveTime(order.reserve_time),
          status: order.status,
          phone: order.phone,
          topic: order.topic,
        }));
        // 合并连续时间段的订单
        const mergedOrders = this.mergeConsecutiveOrders(allOrders);
        // 过滤不同状态的订单
        const reservedOrders = mergedOrders.filter(order => order.status === '已预约');
        const completedOrders = mergedOrders.filter(order => order.status === '已完成');
        const subscribedOrders = mergedOrders.filter(order => order.status === '已订阅');
        // 更新页面数据
        this.setData({
          allOrders: mergedOrders,
          reservedOrders,
          completedOrders,
          subscribedOrders,
          currentOrders: mergedOrders,  // 默认显示全部订单
        });
      } else {
        wx.showToast({
          title: res.result.message || '获取订单失败',
          icon: 'none',
        });
      }
    } catch (err) {
      wx.showToast({
        title: '获取订单失败',
        icon: 'none',
      });
    }
  },

  // 切换标签
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    let currentOrders = [];

    // 根据不同标签过滤显示的订单
    if (tab === 'all') currentOrders = this.data.allOrders;
    if (tab === 'reserved') currentOrders = this.data.reservedOrders;
    if (tab === 'completed') currentOrders = this.data.completedOrders;
    if (tab === 'subscribed') currentOrders = this.data.subscribedOrders;

    // 更新当前显示的订单列表
    this.setData({
      selectedTab: tab,
      currentOrders,
    });
  },
});
