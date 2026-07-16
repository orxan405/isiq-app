const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.log(`Yanlış push token: ${pushToken}`);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.log('Push notification xətası:', error);
  }
};

module.exports = { sendPushNotification };