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
      const res = await wx.cloud.callFunction({
        name: 'getRecords',
        data: { open_id },
      });

      if (res.result.success) {
        const allOrders = res.result.data.map(order => ({
          _id: order._id,
          room_id: order.room_id,
          date: order.date,
          slot_id: order.slots,
          reserve_time: this.formatReserveTime(order._id),
          status: order.status,
          phone: order.phone,
          topic: order.topic,
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
      wx.showToast({
        title: '获取订单失败',
        icon: 'none',
      });
    }
  },

  updateOrdersAfterBooking(newOrder) {
    const { reservedOrders, allOrders, selectedTab } = this.data;
    reservedOrders.push(newOrder);  
    allOrders.push(newOrder);
    this.setData({
      reservedOrders,
      allOrders,
      currentOrders: selectedTab === 'all' ? allOrders : reservedOrders,
    });
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
    const { orderId, status, index, type } = e.currentTarget.dataset;

    // 输出传入的参数和 currentOrders 数据
    console.log('cancelOrder invoked with data:', { orderId, status, index, type });
    console.log('currentOrders:', this.data.currentOrders);

    // 检查 index 是否有效
    if (typeof index === 'undefined' || !this.data.currentOrders[index]) {
      wx.showToast({
        title: '无法找到该订单',
        icon: 'none',
      });
      console.error('Invalid index or currentOrders[index] is undefined');
      return;
    }

    // 如果订单已取消，则直接返回
    if (status === '已取消') {
      wx.showToast({
        title: '订单已取消',
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
            let updateStatusRes;
            if (type === 'reserved') {
              // 取消预约订单，更新 status 并删除 reservations 数据
              updateStatusRes = await wx.cloud.callFunction({
                name: 'updateOrderStatus',
                data: {
                  orderId,
                  status: '已取消',
                },
              });

              if (updateStatusRes.result.success) {
                const deleteRes = await wx.cloud.callFunction({
                  name: 'deleteReservation',
                  data: { orderId },
                });

                if (!deleteRes.result.success) {
                  throw new Error(deleteRes.result.message || '删除预约记录失败');
                }
              } else {
                throw new Error(updateStatusRes.result.message || '更新订单状态失败');
              }
            } else if (type === 'subscribed') {
              updateStatusRes = await wx.cloud.callFunction({
                name: 'updateOrderStatus',
                data: {
                  orderId,
                  status: '已取消',
                },
              });

              if (!updateStatusRes.result.success) {
                throw new Error(updateStatusRes.result.message || '更新订单状态失败');
              }
            }

            // 确保更新的是有效的订单数据
            const updatedOrders = this.data.currentOrders;

            if (updatedOrders && updatedOrders[index]) {
              // 更新本地订单数据
              updatedOrders[index].status = '已取消';
              updatedOrders[index].cancelled = true;  // 设置取消标记，用来显示已取消文本

              console.log('Updated order:', updatedOrders[index]);

              this.setData({
                currentOrders: updatedOrders,
              });

              wx.showToast({
                title: '订单已取消',
                icon: 'success',
              });
            } else {
              wx.showToast({
                title: '无法更新本地订单数据',
                icon: 'none',
              });
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
