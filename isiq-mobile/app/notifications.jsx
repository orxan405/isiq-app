import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/axios';
import Colors from '../src/constants/colors';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      await api.put('/notifications/read/all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.log('Bildiriş xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return { name: 'heart', color: '#FF4B6E' };
      case 'match': return { name: 'heart-circle', color: '#FF4B6E' };
      case 'message': return { name: 'chatbubble', color: '#6C63FF' };
      case 'superlike': return { name: 'star', color: '#FFC107' };
      default: return { name: 'notifications', color: Colors.primary };
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'İndicə';
    if (mins < 60) return `${mins} dəq`;
    if (hours < 24) return `${hours} saat`;
    return `${days} gün`;
  };

  const handlePress = (notification) => {
    if (notification.type === 'match') {
      Alert.alert(
        '🎉 Match!',
        `${notification.fromUserId?.name} ilə match oldunuz! Söhbəti başlatmaq istəyirsiniz?`,
        [
          { text: 'Xeyr', style: 'cancel' },
          {
            text: '💬 Söhbəti Başlat',
            onPress: () => {
              if (notification.matchId) {
                router.push(`/chat/${notification.matchId}`);
              }
            },
          },
        ]
      );
    } else if (notification.type === 'like') {
      Alert.alert(
        '❤️ Bəyənmə!',
        `${notification.fromUserId?.name} sizi bəyəndi!`,
        [
          { text: 'Xeyr', style: 'cancel' },
          {
            text: '👤 Profilə bax',
            onPress: () => {
              if (notification.fromUserId?._id) {
                router.push(`/user-profile/${notification.fromUserId._id}`);
              }
            },
          },
          {
            text: '✅ Qəbul et',
            onPress: async () => {
              try {
                const response = await api.post(`/matches/like/${notification.fromUserId._id}`);
                if (response.data.isMatch) {
                  Alert.alert(
                    '🎉 Match!',
                    `${notification.fromUserId?.name} ilə match oldunuz!`,
                    [
                      { text: 'Sonra', style: 'cancel' },
                      {
                        text: '💬 Söhbəti Başlat',
                        onPress: () => router.push(`/chat/${response.data.match._id}`),
                      },
                    ]
                  );
                } else {
                  Alert.alert('✅', 'Bəyəndiniz!');
                }
              } catch (error) {
                Alert.alert('Xəta', error.response?.data?.message || 'Qəbul edilmədi');
              }
            },
          },
        ]
      );
    } else if (notification.type === 'superlike') {
      Alert.alert(
        '⭐ Super Like!',
        `${notification.fromUserId?.name} sizə Super Like göndərdi!`,
        [
          { text: 'Sonra', style: 'cancel' },
          {
            text: '👤 Profilə bax',
            onPress: () => {
              if (notification.fromUserId?._id) {
                router.push(`/user-profile/${notification.fromUserId._id}`);
              }
            },
          },
          {
            text: '✅ Qəbul et',
            onPress: async () => {
              try {
                const response = await api.post(`/matches/like/${notification.fromUserId._id}`);
                if (response.data.isMatch) {
                  Alert.alert(
                    '🎉 Match!',
                    `${notification.fromUserId?.name} ilə match oldunuz!`,
                    [
                      { text: 'Sonra', style: 'cancel' },
                      {
                        text: '💬 Söhbəti Başlat',
                        onPress: () => router.push(`/chat/${response.data.match._id}`),
                      },
                    ]
                  );
                } else {
                  Alert.alert('✅', 'Bəyəndiniz!');
                }
              } catch (error) {
                Alert.alert('Xəta', error.response?.data?.message || 'Qəbul edilmədi');
              }
            },
          },
        ]
      );
    } else if (notification.type === 'message') {
      if (notification.matchId) {
        router.push(`/chat/${notification.matchId}`);
      }
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getIcon(item.type);
    const fromUser = item.fromUserId;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notifLeft}>
          {fromUser?.photos?.length > 0 ? (
            <Image source={{ uri: fromUser.photos[0] }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{fromUser?.name?.[0] || '?'}</Text>
            </LinearGradient>
          )}
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={12} color={Colors.white} />
          </View>
        </View>

        <View style={styles.notifInfo}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        </View>

        <View style={styles.notifRight}>
          <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirişlər</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>Bildiriş yoxdur</Text>
          <Text style={styles.emptyText}>Yeni bildirişlər burada görünəcək</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
  list: { padding: 16, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  notifCardUnread: {
    backgroundColor: '#FFF8F9',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notifLeft: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  iconBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 20, height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  notifBody: { fontSize: 13, color: Colors.textLight, lineHeight: 18 },
  notifRight: { alignItems: 'flex-end', gap: 6 },
  notifTime: { fontSize: 11, color: Colors.textLight },
  unreadDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight },
});