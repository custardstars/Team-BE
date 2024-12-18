// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();

exports.main = async (event, context) => {
  const { room_id, date, user_id } = event;
  try {
    const result = await db.collection('records')
      .where({
        room_id: room_id,
        date: date,
        user_id: user_id,
        status: '已订阅'
      })
      .get();
    return {
      code: 200,
      data: result.data // 返回数据库中的预约记录
    };
  } catch (err) {
    return {
      code: 500,
      message: '查询失败',
      error: err
    };
  }
};