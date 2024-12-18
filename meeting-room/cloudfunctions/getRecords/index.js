// 云函数入口函数
exports.main = async (event, context) => {
  const db = wx.cloud.database();
  const reservations = db.collection('reservations');
  const { user_id } = event;  // 获取传入的 user_id

  try {
    // 查询数据库
    const result = await reservations.where({
      user_id: user_id  // 根据 user_id 查询
    }).get();
    if (result.data.length === 0) {
      return {
        code: 404,
        message: '没有找到订单',
      };
    }
    return {
      code: 200,
      data: result.data,  // 返回查询到的数据
    };
  } catch (err) {
    return {
      code: 500,
      message: '查询失败',
    };
  }
};
