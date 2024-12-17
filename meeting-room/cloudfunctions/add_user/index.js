// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();

exports.main = async (event) => {
  const { user_id, username, avatar } = event;

  try {
    // 检查用户是否已存在
    const userExists = await db.collection('users').where({ user_id }).get();
    if (userExists.data.length > 0) {
      return { success: true, message: '用户已存在' };
    }

    // 插入新用户
    await db.collection('users').add({
      data: {
        user_id,
        username,
        avatar
      }
    });

    return { success: true, message: '用户添加成功' };
  } catch (err) {
    return { success: false, error: err };
  }
};