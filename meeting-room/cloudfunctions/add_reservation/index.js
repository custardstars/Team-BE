
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const { user_id, selectedSlots, room_id, date } = event;
  if (!user_id || !selectedSlots || selectedSlots.length === 0) {
    console.error("Invalid parameters:", { user_id, selectedSlots });
    return { success: false, message: '参数错误' };
  }

  try {
    const reserveTime = new Date();
    console.log("Starting to add reservations...");

    // 创建预约记录的任务
    const tasks = selectedSlots.map(slot => {
      console.log(`Adding slot: ${slot} for user_id: ${user_id}`);

      return db.collection('reservations').add({
        data: {
          user_id,
          slot_id: slot, // 将预约的时间段slot存储
          room_id,
          date,
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
