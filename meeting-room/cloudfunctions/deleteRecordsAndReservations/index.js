// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const records = db.collection('records');
const reservations = db.collection('reservations');

exports.main = async (event, context) => {
  const { orderId } = event;

  try {
    // 删除 records 表中的对应订单
    await records.doc(orderId).remove();
    
    // 删除 reservations 表中的对应订单
    await reservations.doc(orderId).remove();
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};
