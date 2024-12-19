const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function delete_reservation(user_id, date, room_id,slots) {
  try {
    const deleteRes = await db.collection('reservations')
      .where({
        user_id: user_id,
        room_id: room_id,
        date: date,
        slot_id: db.command.in(slots),
      })
      .remove();

    console.log('Deleted from reservations:', deleteRes);

    // 更新 records 数据库中符合条件的 status 为 "已取消"
    const updateRes = await db.collection('records')
      .where({
        user_id: user_id,
        room_id: room_id,
        date: date,
        slot_id: db.command.in(slots),
      })
      .update({
        data: {
          status: '已取消',
        },
      });
    console.log('Updated records status:', updateRes);
    return { success: true, message: '预约已取消' };
  } catch (error) {
    console.error('delete_reservation error:', error);
    return { success: false, message: '取消预约失败', error };
  }
}

exports.main = async (event) => {
  const { user_id, date, room_id, slots } = event;
  if (!user_id || !date || !room_id || !slots) {
    return { success: false, message: '参数不完整' };
  }
  return await delete_reservation(user_id, date, room_id, slots);
};