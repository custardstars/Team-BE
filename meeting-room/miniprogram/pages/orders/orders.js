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


    // 按照预约时间（reserve_time）降序排序，最新下单的排在最上面
    orders.sort((a, b) => {
      const dateA = new Date(a.reserve_time).getTime();
      const dateB = new Date(b.reserve_time).getTime();
      return dateB - dateA;  // 降序排序：最新的排在前面
    });


    let currentOrder = null;

    // 遍历所有订单
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      if (currentOrder === null) {
        currentOrder = { ...order }; // 初始化第一个订单
      } else {
        // 判断当前订单与前一订单的时间段是否连续
        const currentSlotEndTime = this.getEndTime(currentOrder.slot_id);
        const nextSlotStartTime = this.getStartTime(order.slot_id);

        // 如果连续（即当前订单结束时间等于下一个订单开始时间），则合并
        if (this.isConsecutive(currentSlotEndTime, nextSlotStartTime)) {
          // 合并时间段（拼接时间段）
          currentOrder.slot_id = `${currentOrder.slot_id.split('--')[0]}--${order.slot_id.split('--')[1]}`;
        } else {
          // 否则，将当前订单加入合并列表
          mergedOrders.push(currentOrder);
          currentOrder = { ...order };  // 更新当前订单
        }
      }
    }

    // 将最后一个订单加入合并列表
    if (currentOrder !== null) {
      mergedOrders.push(currentOrder);
    }

    return mergedOrders;
  },

  // 判断两个时间段是否是连续的
  isConsecutive(endTime, startTime) {
    const diff = new Date(startTime).getTime() - new Date(endTime).getTime();
    return diff === 0;  // 判断两个时间段是否紧接
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

  // 更新订单数据（例如在预约之后）
  updateOrdersAfterBooking(newOrder) {
    const { reservedOrders, allOrders, selectedTab } = this.data;

    // 确保新订单被添加到已预约订单列表
    reservedOrders.push(newOrder);  
    allOrders.push(newOrder); // 更新全部订单

    // 更新页面数据
    this.setData({
      reservedOrders,
      allOrders,
      currentOrders: selectedTab === 'all' ? allOrders : reservedOrders, // 根据当前tab显示不同的订单
    });
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
