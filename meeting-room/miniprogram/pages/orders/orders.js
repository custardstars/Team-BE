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
    console.log('获取到的 open_id:', open_id);  // 输出 open_id 值
    
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

      // 输出返回的结果
      console.log('云函数返回结果:', res);

      // 如果查询成功，格式化数据并显示
      if (res.result.success) {
        const allOrders = res.result.data.map(order => ({
          room_id: order.room_id,
          date: order.date,
          slot_id: order.slot_id,
          reserve_time: this.formatReserveTime(order.reserve_time),  // 格式化时间
          status: order.status,  // 确保 status 字段存在并且被正确返回
        }));

        // 过滤不同状态的订单
        const reservedOrders = allOrders.filter(order => order.status === '已预约');
        const completedOrders = allOrders.filter(order => order.status === '已完成');
        const subscribedOrders = allOrders.filter(order => order.status === '已订阅');

        // 更新页面数据
        this.setData({
          allOrders,
          reservedOrders,
          completedOrders,
          subscribedOrders,
          currentOrders: allOrders,  // 默认显示全部订单
        });
      } else {
        wx.showToast({
          title: res.result.message || '获取订单失败',
          icon: 'none',
        });
      }
    } catch (err) {
      console.error('获取订单失败', err);
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
