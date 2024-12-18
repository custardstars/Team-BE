const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { user_id, selectedSlots, room_id, date,phone,number,topic } = event;
  try {
    const reserveTime = new Date();
    // 创建预约记录的任务
    const tasks = selectedSlots.map(slot => {
      db.collection('records').add({
        data: {
          user_id,
          slot_id: slot,
          room_id,
          date,
          topic,
          phone,
          number,
          reserve_time: reserveTime,
          status: '已预约',
        }
      });
      return db.collection('reservations').add({
        data: {
          user_id,
          slot_id: slot, // 将预约的时间段slot存储
          room_id,
          date,
          topic,
          phone,
          number,
          reserve_time: reserveTime
        }
      });
    });
    // 执行所有预约任务
    await Promise.all(tasks);
    return { success: true, message: '预约成功' };
  } catch (err) {
    return { success: false, error: err };
  }
};
