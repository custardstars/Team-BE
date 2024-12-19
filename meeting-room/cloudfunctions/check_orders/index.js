const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function upd_status(room_id, slots, date, user_id,topic,phone,number,reserve_time) {
  try {
    const res = await db.collection('records')
      .where({
        room_id: room_id,
        date: date,
        slot_id: db.command.in(slots),
        user_id: user_id,
      })
      .update({
        data: {
          status: '已预约', // 更新为已预约状态
        },
      });
      // 加入 reservations
      slots.map(slot => {
        return db.collection('reservations').add({
          data: {
            user_id,
            slot_id: slot,
            room_id,
            date,
            topic,
            phone,
            number,
            reserve_time,
          }
        });
      });
    console.log('upd_status updated records:', res);
    return { success: true, message: '状态更新成功' };
  } catch (error) {
    console.error('upd_status error:', error);
    return { success: false, message: '状态更新失败', error };
  }
}

// 观察者模式
exports.main = async (event) => {
  const { date, room_id } = event;
  if (!date || !room_id) {
    return { success: false, message: '参数不完整' };
  }
  try {
    // 查询 waitings 数据库中符合条件的记录并按 reserve_time 排序
    const waitingsRes = await db.collection('waitings')
      .where({
        date: date,
        room_id: room_id,
      })
      .orderBy('reserve_time', 'asc') // 按 reserve_time 升序排列
      .get();

    const waitings = waitingsRes.data;
    console.log('Retrieved waitings:', waitings);

    // 遍历所有等待记录
    for (const waiting of waitings) {
      const { slots, user_id,topic,phone,number,reserve_time } = waiting;
      // 检查 slots 中的每一项 slot 是否都不在 reservations 中
      const reservationsCheck = await db.collection('reservations')
        .where({
          room_id: room_id,
          date: date,
          slot_id: db.command.in(slots),
        })
        .get();
      if (reservationsCheck.data.length === 0) {
        // 如果满足条件，删除当前 waiting 数据
        const deleteWaiting = await db.collection('waitings')
          .where({
            _id: waiting._id,
          })
          .remove();
        console.log('Deleted waiting record:', deleteWaiting);
        // 调用 upd_status 更新状态
        const updateStatus = await upd_status(room_id, slots, date, user_id,topic,phone,number,reserve_time);
        return updateStatus; // 返回更新状态的结果
      }
    }
    // 如果没有找到符合条件的记录
    return { success: false, message: '没有满足条件的等待记录' };
  } catch (error) {
    console.error('check_order error:', error);
    return { success: false, message: '检查失败', error };
  }
};