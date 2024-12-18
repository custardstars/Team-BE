const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { open_id } = event;
  if (!open_id) {
    console.error("Invalid open_id:", open_id);
    return { success: false, message: '用户未登录或open_id无效' };
  }
  try {
    const res = await db.collection('records')
    .aggregate()
    .match({ user_id: open_id }) // 筛选符合条件的记录
    .group({
      _id: '$reserve_time', // 根据 reserve_time 分组
      slots: db.command.aggregate.addToSet('$slot_id'), // 合并 slot_id 数组
      date: db.command.aggregate.first('$date'), // 获取分组中第一个记录的 date
      phone: db.command.aggregate.first('$phone'),
      topic: db.command.aggregate.first('$topic'),
      room_id: db.command.aggregate.first('$room_id'),
      status: db.command.aggregate.first('$status'),
    })
    .end();
    if(res.list.length==0){
      return { success: false, message: '没有找到相关预约记录' };
    }

    // const allOrders = [];
    // for (const r_time of uniqueReserveTimes) {
    //   console.log(r_time);
    //   const queryRes = await db.collection('records')
    //     .where({
    //       user_id: open_id,
    //       reserve_time: r_time,
    //     })
    //     .get();
    //   // 生成 order 对象并加入到 allOrders 中
    //   const order = {
    //     reserve_time: r_time,
    //     slots: queryRes.data.map(doc => doc.slot_id),
    //     date: queryRes.data[0].date,
    //     phone: queryRes.data[0].phone,
    //     topic: queryRes.data[0].topic,
    //     room_id: queryRes.data[0].room_id,
    //     status: queryRes.data[0].status,
    //   };
    //   allOrders.push(order);
    // }

    return { success: true, data: res.list };

  } catch (err) {
    console.error("查询失败:", err);
    return { success: false, message: '查询失败', error: err };
  }
};
