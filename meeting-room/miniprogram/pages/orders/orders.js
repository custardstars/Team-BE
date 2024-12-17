const db = wx.cloud.database();

Page({
  data: {
    tabs: ['全部', '进行中', '已完成', '订阅'],
    currentTab: 0, // 当前选中的 Tab
    orderList: [], // 存储预约记录
  },

  onLoad() {
    this.fetchOrders(); // 页面加载时默认获取全部记录
  },

  // 切换 Tab
  changeTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index }, () => {
      this.fetchOrders();
    });
  },

  // 获取订单数据
  fetchOrders() {
    wx.showLoading({ title: '加载中...' });
    const { currentTab } = this.data;

    // 根据当前 Tab 筛选状态
    let statusCondition = {};
    switch (currentTab) {
      case 1: // 进行中
        statusCondition = { status: '进行中' };
        break;
      case 2: // 已完成
        statusCondition = { status: '已完成' };
        break;
      case 3: // 订阅
        statusCondition = { status: '订阅' };
        break;
      default:
        statusCondition = {}; // 全部
    }

    // 查询 records 表，关联 users、rooms、time_slots 表
    db.collection('records')
      .where(statusCondition)
      .orderBy('create_time', 'desc')
      .get()
      .then(res => {
        const records = res.data;

        // 获取关联的用户、会议室、时间段数据
        const fetchDetailsPromises = records.map(record => {
          return Promise.all([
            db.collection('users').where({ user_id: record.user_id }).get(),
            db.collection('rooms').where({ room_id: record.room_id }).get(),
            db.collection('time_slots').where({ slot_id: record.slot_id }).get()
          ]).then(([userRes, roomRes, timeSlotRes]) => {
            return {
              ...record,
              username: userRes.data[0]?.username || '未知用户',
              room_name: roomRes.data[0]?.room_name || '未知会议室',
              period: timeSlotRes.data[0]?.period || '',
              date: timeSlotRes.data[0]?.date || '',
            };
          });
        });

        // 更新数据
        Promise.all(fetchDetailsPromises).then(orderList => {
          this.setData({ orderList });
          wx.hideLoading();
        });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ title: '数据加载失败', icon: 'none' });
        wx.hideLoading();
      });
  },
});
