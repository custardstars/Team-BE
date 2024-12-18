// 云函数: getRecords
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event) => {
  const { open_id } = event;
  
  if (!open_id) {
    console.error("Invalid open_id:", open_id);
    return { success: false, message: '用户未登录或open_id无效' };
  }

  try {
    console.log("开始查询用户的预约记录...");
    
    // 根据 open_id 查询 records 集合中的记录
    const result = await db.collection('records').where({ user_id: open_id }).get();

    // 查看查询结果
    console.log("查询结果:", result);

    // 如果查询结果为空
    if (result.data.length === 0) {
      return { success: false, message: '没有找到相关预约记录' };
    }

    // 返回查询结果
    return { success: true, data: result.data };
  } catch (err) {
    console.error("查询失败:", err);
    return { success: false, message: '查询失败', error: err };
  }
};
