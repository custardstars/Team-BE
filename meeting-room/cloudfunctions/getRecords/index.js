const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { user_id } = event;

  try {
    // 获取用户的预约记录
    const reservationRecords = await db.collection('reservations')
      .aggregate()
      .match({ user_id: user_id })
      .lookup({
        from: 'time_slots',
        localField: 'slot_id',
        foreignField: 'slot_id',
        as: 'slot_info'
      })
      .lookup({
        from: 'rooms',
        localField: 'room_id',
        foreignField: 'room_id',
        as: 'room_info'
      })
      .end();

    // 获取用户的订阅记录（从 waiting 表中获取）
    const waitingRecords = await db.collection('waitings')
      .aggregate()
      .match({ user_id: user_id })
      .lookup({
        from: 'time_slots',
        localField: 'slot_id',
        foreignField: 'slot_id',
        as: 'slot_info'
      })
      .lookup({
        from: 'rooms',
        localField: 'room_id',
        foreignField: 'room_id',
        as: 'room_info'
      })
      .end();

    // 获取用户的取消记录（从 records 表中获取，状态为 "cancelled"）
    const cancelledRecords = await db.collection('records')
      .aggregate()
      .match({ user_id: user_id, status: 'cancelled' })
      .lookup({
        from: 'time_slots',
        localField: 'slot_id',
        foreignField: 'slot_id',
        as: 'slot_info'
      })
      .lookup({
        from: 'rooms',
        localField: 'room_id',
        foreignField: 'room_id',
        as: 'room_info'
      })
      .end();

    return {
      reservationRecords: reservationRecords.list,
      waitingRecords: waitingRecords.list,
      cancelledRecords: cancelledRecords.list
    };

  } catch (err) {
    console.error(err);
    return { error: err };
  }
};
