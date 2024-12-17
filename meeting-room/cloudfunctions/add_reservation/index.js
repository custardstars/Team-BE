// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境


const db = cloud.database();
exports.main = async (event) => {
  const { user_id, selectedSlots } = event;
  try {
    const reserveTime = new Date();
    const tasks = selectedSlots.map(slot_id => {
      return db.collection('reservations').add({
        data: {
          user_id,
          slot_id,
          room_id: 1, // 这里可以让前端传递实际的 room_id
          reserve_time: reserveTime
        }
      });
    });

    await Promise.all(tasks);
    return { success: true, message: '预约成功' };
  } catch (err) {
    return { success: false, error: err };
  }
};