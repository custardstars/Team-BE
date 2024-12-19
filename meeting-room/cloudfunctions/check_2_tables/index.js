const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const currentTime = new Date();
  console.log('Current Time:', currentTime);

  try {
    // 查询 reservations 表中的记录
    const reservationsRes = await db.collection('reservations').get();
    const reservations = reservationsRes.data;
    console.log('Reservations:', reservations);

    // 遍历 reservations 表中的记录并进行比对
    for (const reservation of reservations) {
      console.log('Processing Reservation:', reservation);
      
      // 解析 date 和 slot_id
      const [startTime, endTime] = reservation.slot_id.split('--');
      const [month, day] = reservation.date.split('-');

      // 分别解析 hour 和 minute
      const [endHour, endMinute] = endTime.split(':').map(Number);

      // 创建 reservation 结束时间
      const reservationEndDateTime = new Date(currentTime.getFullYear(), month - 1, day, endHour, endMinute);

      console.log('Reservation End DateTime:', reservationEndDateTime);
      console.log('End Hour:', endHour, 'End Minute:', endMinute);

      // 比较当前时间和 reservation 结束时间
      if (currentTime > reservationEndDateTime) {
        console.log('Current time exceeds reservation end time. Removing reservation and updating record.');
        
        // 当前时间超过预约结束时间，删除该记录
        await db.collection('reservations').doc(reservation._id).remove();

        // 更新 records 表中的记录状态
        const recordRes = await db.collection('records').where({
          date: reservation.date,
          slot_id: reservation.slot_id,
          room_id: reservation.room_id,
          user_id: reservation.user_id
        }).get();

        const records = recordRes.data;
        console.log('Records to update:', records);

        if (records.length === 0) {
          console.log('No matching records found in records collection.');
        }

        for (const record of records) {
          let newStatus = record.status;
          console.log('Original Status:', record.status);

          if (record.status === '已预约') {
            newStatus = '已完成';
          } else if (record.status === '已订阅') {
            newStatus = '已取消';
          }
          console.log('Evaluated New Status:', newStatus);

          if (newStatus !== record.status) {
            await db.collection('records').doc(record._id).update({
              data: {
                status: newStatus
              }
            });
            console.log('Record updated:', record._id, 'New Status:', newStatus);
          } else {
            console.log('Record status unchanged:', record._id, 'Status:', record.status);
          }
        }
      }
    }

    return {
      message: '数据库更新完成'
    };
  } catch (error) {
    console.error('Error occurred:', error);
    return {
      message: '数据库更新失败',
      error: error.toString()
    };
  }
};
