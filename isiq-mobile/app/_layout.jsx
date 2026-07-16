import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { SocketProvider } from '../src/context/SocketContext';
import { useAuth } from '../src/context/AuthContext';
import { useSocket } from '../src/context/SocketContext';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider } from '@stripe/stripe-react-native';
import api from '../src/api/axios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutNav() {
  const { user } = useAuth();
  const { incomingCall, clearIncomingCall, socket } = useSocket();
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        registerForPushNotifications();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        if (user) {
          try {
            await api.put('/users/settings', { isActive: true });
          } catch (error) {
            console.log('AppState xətası:', error.message);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [user]);

  // Gələn zəng
  useEffect(() => {
    if (incomingCall && user) {
      Alert.alert(
        `📞 ${incomingCall.callerName} zəng edir`,
        `${incomingCall.type === 'video' ? '📹 Video' : '🎤 Səs'} zəngi`,
        [
          {
            text: '❌ Rədd et',
            style: 'destructive',
            onPress: () => {
              socket?.emit('call:reject', {
                callerId: incomingCall.callerId,
                receiverId: user.id,
              });
              clearIncomingCall();
            },
          },
          {
            text: '✅ Qəbul et',
            onPress: () => {
              clearIncomingCall();
              router.push({
                pathname: `/call/${incomingCall.matchId}`,
                params: {
                  callerId: incomingCall.callerId,
                  callerName: incomingCall.callerName,
                  type: incomingCall.type,
                  isIncoming: 'true',
                },
              });
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [incomingCall]);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Push bildirişlər yalnız real cihazda işləyir');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF4B6E',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push bildiriş icazəsi verilmədi');
        return;
      }

      const projectId = 'd2d640c1-7e5c-457c-a51d-5e49b5ae4702';
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('Access token yoxdur');
        return;
      }

      const response = await api.put('/users/push-token', { pushToken: token });
      console.log('Push token saxlandı:', response.data);
    } catch (error) {
      console.log('Push token xətası:', error.message);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[matchId]" />
      <Stack.Screen name="call/[matchId]" />
      <Stack.Screen name="user-profile/[id]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="coin-shop" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="withdrawal" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey="pk_test_51Tt04MIExiQ1IGMgsj2sHmEQ6D25iltXEWy9FuVGvf9MQayZcP4Alo0e3VR75lFKLCfeCxDgp1Ri8M7vEcaiJxEg007x3StijJ">
        <AuthProvider>
          <SocketProvider>
            <RootLayoutNav />
          </SocketProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}