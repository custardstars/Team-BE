const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;
  const periods = [
    '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'
  ];

  let slotId = event.startSlotId;
  const date = new Date(event.date);

  // 格式化日期为 MM-DD
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

  for (let period of periods) {
    await db.collection('time_slots').add({
      data: {
        slot_id: slotId,
        period: period,
        date: formattedDate
      }
    });
    slotId++;
  }

  return {
    message: `Time slots for ${event.date} generated successfully`
  };
};
