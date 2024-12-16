// cloudfunctions/updateSignature/index.js
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event) => {
  const { user_id, signature } = event;
  const res = await db.collection('users').doc(user_id).update({
    data: {
      signature,
    },
  });
  return res;
};