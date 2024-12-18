exports.main = async (event, context) => {
  const { orderId, status } = event;
  const db = wx.cloud.database();
  const records = db.collection('records');

  try {
    await records.doc(orderId).update({
      data: {
        status: status,
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};
