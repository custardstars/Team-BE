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
      console.log('调用云函数前，open_id:', open_id);  // 调试输出

      const res = await wx.cloud.callFunction({
        name: 'getRecords',  // 调用云函数
        data: {
          user_id: open_id,  // 将 open_id 作为 user_id 传给云函数
        },
      });

      console.log('云函数返回的结果:', res);  // 调试输出

      if (res.result.code === 200) {
        // 格式化时间并分配给订单
        const allOrders = res.result.data.map(order => ({
          ...order,
          reserve_time: this.formatReserveTime(order.reserve_time),  // 格式化时间
        }));

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
      } else {
        wx.showToast({
          title: '获取订单失败: ' + res.result.message,
          icon: 'error',
        });
      }
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
    allOrders.push(newOrder); // 更新全部订单
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
    if (tab === 'all') currentOrders = this.data.allOrders;
    if (tab === 'reserved') currentOrders = this.data.reservedOrders;
    if (tab === 'completed') currentOrders = this.data.completedOrders;
    if (tab === 'subscribed') currentOrders = this.data.subscribedOrders;

    this.setData({
      selectedTab: tab,
      currentOrders,
    });
  },
});
