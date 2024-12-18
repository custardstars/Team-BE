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

    return { success: true, data: res.list };

  } catch (err) {
    console.error("查询失败:", err);
    return { success: false, message: '查询失败', error: err };
  }
};
