const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function upd_status(room_id, slots, date, user_id, topic, phone, number, reserve_time) {
  try {
    // 给用户发送订阅消息
    // const sendMessageRes = await cloud.openapi.subscribeMessage.send({
    //   touser: user_id, // 用户的 OpenID
    //   templateId: '0nN4c5gDB5DWOdL0qr3Bo4o7sF7gj1sHL-21rNcOIxs', // 订阅消息模板ID
    //   page: '/pages/index/index', // 点击消息跳转的页面路径
    //   data: {
    //     keyword1: { value: room_id }, // 会议室名称
    //     keyword2: { value: date }, // 日期
    //     keyword3: { value: slots.join(', ') }, // 时间段
    //     keyword4: { value: topic }, // 主题
    //     keyword5: { value: phone }, // 联系电话
    //     keyword6: { value: number }, // 预订人数
    //   },
    // });

    console.log('消息推送结果:', 111);

    // 更新 records 数据库中的状态为 "已预约"
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

    console.log('upd_status updated records:', res);

    // 添加到 reservations 数据库
    const promises = slots.map(slot => {
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
        },
      });
    });

    await Promise.all(promises);

    return { success: true, message: '状态更新成功，并成功发送消息' };
  } catch (error) {
    console.error('upd_status error:', error);
    return { success: false, message: '状态更新或消息推送失败', error };
  }
}

exports.upd_status = upd_status;

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

    let found = false;
    // 遍历所有等待记录
    for (const waiting of waitings) {
      const { slots, user_id, topic, phone, number, reserve_time } = waiting;
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
        await upd_status(room_id, slots, date, user_id, topic, phone, number, reserve_time);
        found = true;
        break; // 找到一个匹配的等待记录并处理后退出循环
      }
    }
    if (found) return { success: true };
    return { success: false, message: '没有满足条件的等待记录' };
  } catch (error) {
    console.error('check_order error:', error);
    return { success: false, message: '检查失败', error };
  }
};
