exports.main = async (event, context) => {
  const { orderId } = event;
  const db = wx.cloud.database();
  const reservations = db.collection('reservations');

  try {
    await reservations.doc(orderId).remove();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};
