// cloudfunctions/addUser/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();

exports.main = async (event) => {
  const { avatar, username } = event;
  const res = await db.collection('users').add({
    data: {
      avatar,
      username,
      signature: '这位用户还没有签名',
    },
  });
  return { user_id: res._id };
};