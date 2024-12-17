// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境


const db = cloud.database();
exports.main = async (event) => {
  const { user_id, selectedSlots } = event;

  console.log("Received event:", event); // 打印接收到的参数

  if (!user_id || !selectedSlots || selectedSlots.length === 0) {
    console.error("Invalid parameters:", { user_id, selectedSlots });
    return { success: false, message: '参数错误' };
  }

  try {
    const reserveTime = new Date();
    console.log("Starting to add reservations...");

    const tasks = selectedSlots.map(slot_id => {
      console.log(`Adding slot_id: ${slot_id} for user_id: ${user_id}`);
      return db.collection('reservations').add({
        data: {
          user_id,
          slot_id,
          room_id: 1, // 假设 room_id 为 1
          reserve_time: reserveTime
        }
      });
    });

    await Promise.all(tasks);
    console.log("Reservations added successfully!");

    return { success: true, message: '预约成功' };
  } catch (err) {
    console.error("Error adding reservations:", err);
    return { success: false, error: err };
  }
};