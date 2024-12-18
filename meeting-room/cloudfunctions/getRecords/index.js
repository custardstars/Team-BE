// 云函数入口函数
exports.main = async (event, context) => {
  const db = wx.cloud.database();
  const reservations = db.collection('reservations');
  const { user_id } = event;  // 获取传入的 user_id

  console.log('开始查询，传入的 user_id:', user_id);  // 输出传入的 user_id

  try {
    // 查询数据库
    const result = await reservations.where({
      user_id: user_id  // 根据 user_id 查询
    }).get();

    console.log('查询结果:', result);  // 输出查询结果

    if (result.data.length === 0) {
      console.log('没有找到订单');  // 如果没有查询到数据
      return {
        code: 404,
        message: '没有找到订单',
      };
    }

    // 返回查询结果
    return {
      code: 200,
      data: result.data,  // 返回查询到的数据
    };
  } catch (err) {
    console.error('查询失败', err);  // 如果查询失败，输出错误信息
    return {
      code: 500,
      message: '查询失败',
    };
  }
};
