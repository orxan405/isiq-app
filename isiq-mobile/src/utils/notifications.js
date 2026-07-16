import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4B6E',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push bildiriş icazəsi verilmədi');
      return null;
    }

    try {
      const projectId = 'd2d640c1-7e5c-457c-a51d-5e49b5ae4702';
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (error) {
      console.log('Push token xətası:', error);
      return null;
    }
  } else {
    console.log('Push bildirişlər yalnız real cihazda işləyir');
  }

  return token;
}

export async function savePushToken(token) {
  if (!token) return;
  try {
    await api.put('/users/push-token', { pushToken: token });
  } catch (error) {
    console.log('Push token saxlama xətası:', error);
  }
}