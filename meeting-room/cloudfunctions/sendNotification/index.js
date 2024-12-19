const cloud = require('wx-server-sdk');

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, message } = event;

  const TEMPLATE_ID = '0nN4c5gDB5DWOdL0qr3Bo4o7sF7gj1sHL-21rNcOIxs'; // 请替换为你的订阅消息模板 ID

  try {
    const userRes = await db.collection('users').doc(userId).get();
    const user = userRes.data;

    if (!user) {
      throw new Error('User not found');
    }
    console.log('aaaaaaa',user);
    // 调用微信的订阅消息发送接口
    const result = await cloud.openapi.subscribeMessage.send({
      touser: user.openId,
      templateId: TEMPLATE_ID,
      page: 'pages/index/index', // 用户点击通知后打开的页面
      data: {
        phrase1: {
          value: '会议室预约通知'
        },
        thing2: {
          value: message
        },
        time3: {
          value: new Date().toLocaleString()
        }
      }
    });

    console.log('Subscription message sent:', result);
    return {
      success: true,
      message: '消息发送成功'
    };
  } catch (error) {
    console.error('Error sending subscription message:', error);
    return {
      success: false,
      message: '消息发送失败',
      error: error.toString()
    };
  }
};
