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
    this.fetchOrders();
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
      const res = await wx.cloud.database().collection('reservations')
        .where({ user_id: open_id })
        .get();

      const allOrders = res.data;
      const reservedOrders = allOrders.filter(order => order.status === '已预约');
      const completedOrders = allOrders.filter(order => order.status === '已完成');
      const subscribedOrders = allOrders.filter(order => order.status === '已订阅');

      this.setData({
        allOrders,
        reservedOrders,
        completedOrders,
        subscribedOrders,
        currentOrders: allOrders,  // 默认显示全部订单
      });
    } catch (err) {
      console.error('获取订单失败', err);
      wx.showToast({
        title: '获取订单失败',
        icon: 'error',
      });
    }
  },

  // 更新订单数据（例如在预约之后）
  updateOrdersAfterBooking(newOrder) {
    const { reservedOrders, allOrders, selectedTab } = this.data;
    reservedOrders.push(newOrder);  // 将新预约订单添加到已预约订单列表
    allOrders.push(newOrder);       // 将新预约订单添加到全部订单列表

    // 确保当前选择的tab更新显示
    let updatedCurrentOrders = [];
    if (selectedTab === 'reserved') {
      updatedCurrentOrders = reservedOrders;
    } else if (selectedTab === 'all') {
      updatedCurrentOrders = allOrders;
    }

    this.setData({
      reservedOrders,
      allOrders,
      currentOrders: updatedCurrentOrders,  // 更新当前显示的订单
    });
  },
  
  // 根据选择的标签切换显示的订单
  onTabChange(e) {
    const selectedTab = e.currentTarget.dataset.tab;
    this.setData({
      selectedTab,
      currentOrders: this.getCurrentOrders(selectedTab),
    });
  },
 
  getCurrentOrders(selectedTab) {
    switch (selectedTab) {
      case 'all':
        return this.data.allOrders;
      case 'reserved':
        return this.data.reservedOrders;
      case 'completed':
        return this.data.completedOrders;
      case 'subscribed':
        return this.data.subscribedOrders;
      default:
        return [];
    }
  },
});
