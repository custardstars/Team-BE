// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
exports.main = async (event, context) => {
  try {
    const result = await db.collection('rooms').field({ room_name: true }).get();
    return {
      code: 200,
      data: result.data.map(item => item.room_name), // 返回所有 room_name
    };
  } catch (err) {
    return {
      code: 500,
      message: '查询失败',
      error: err
    };
  }
};