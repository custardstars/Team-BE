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
  formatReserveTime(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',second: '2-digit' };
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
      const res = await wx.cloud.callFunction({
        name: 'getRecords',
        data: { open_id },
      });
      if (res.result.success) {
        const allOrders = res.result.data.map(order => ({
          _id: order._id,
          room_id: order.room_id,
          date: order.date,
          slots: order.slots.sort().sort((str1, str2) => { 
            const a1 = parseInt(str1.split(':')[0]);
            const a2 = parseInt(str2.split(':')[0]);
            return a1 - a2; 
          }),
          reserve_time: this.formatReserveTime(order._id),
          status: order.status,
          phone: order.phone,
          topic: order.topic,
        }));
        // 对 allOrders 按照 reserve_time 从大到小排序
        allOrders.sort((a, b) => new Date(b.reserve_time) - new Date(a.reserve_time));
        console.log('orders',allOrders);
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
      wx.showToast({
        title: '获取订单失败',
        icon: 'none',
      });
    }
  },

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

  async cancelOrder(e) {
    const {status,date,slots,room_id,phone,number,reserve_time} = e.currentTarget.dataset.order;
    // 输出传入的参数和 currentOrders 数据
    console.log('cancelOrder invoked with data:', e.currentTarget.dataset);
    // 如果订单已取消/完成，则直接返回
    if (status === '已取消') {
      wx.showToast({
        title: '订单已取消',
        icon: 'none',
      });
      return;
    }
    if (status === '已完成') {
      wx.showToast({
        title: '订单已完成',
        icon: 'none',
      });
      return;
    }
    wx.showModal({
      title: '确认取消',
      content: '您确定要取消这个预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const user_id = wx.getStorageSync('open_id');
            console.log('status',status);
            let deleteRes;
            if (status === '已预约') {
              deleteRes = await wx.cloud.callFunction({
                name: 'delete_reservation',
                data: { user_id, date, room_id, slots },
              });
              await wx.cloud.callFunction({
                name: 'check_orders',
                data: { user_id, date, room_id, slots ,phone,number,reserve_time},
              });
            } else if (status === '已订阅') {
              deleteRes = await wx.cloud.callFunction({
                name: 'delete_subscribe',
                data: { user_id, date, room_id, slots },
              });
            }
            if (deleteRes.result.success) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success',
              });
              this.fetchOrders();
            } else {
              throw new Error(deleteRes.result.message || '删除失败，请稍后再试');
            }
          } catch (error) {
            wx.showToast({
              title: error.message || '取消失败，请稍后再试',
              icon: 'none',
            });
          }
        }
      },
    });
  },
});
