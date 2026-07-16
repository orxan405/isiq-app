import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/axios';
import Colors from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches');
      setMatches(response.data.matches);
    } catch (error) {
      console.log('matches xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (match) => {
    if (!user) return null;
    return match.users.find((u) => u._id.toString() !== user.id.toString());
  };

  const isUserOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const diff = new Date() - new Date(lastSeen);
    return diff < 5 * 60 * 1000; // 5 dəqiqə
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Dünən';
    return `${days} gün`;
  };

  const handleLongPress = (matchId) => {
    setSelectMode(true);
    setSelectedIds([matchId]);
  };

  const handleSelect = (matchId) => {
    if (!selectMode) return;
    setSelectedIds((prev) =>
      prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId]
    );
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      'Silinsin?',
      `${selectedIds.length} söhbət silinəcək. Əminsiniz?`,
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedIds.map((id) => api.delete(`/matches/${id}`)));
              setMatches((prev) => prev.filter((m) => !selectedIds.includes(m._id)));
              setSelectedIds([]);
              setSelectMode(false);
            } catch (error) {
              Alert.alert('Xəta', 'Silinmədi');
            }
          },
        },
      ]
    );
  };

  const renderMatch = ({ item }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const isSelected = selectedIds.includes(item._id);
    const online = isUserOnline(otherUser.lastSeen);

    return (
      <TouchableOpacity
        style={[styles.matchCard, isSelected && styles.matchCardSelected]}
        onPress={() => {
          if (selectMode) {
            handleSelect(item._id);
          } else {
            router.push(`/chat/${item._id}`);
          }
        }}
        onLongPress={() => handleLongPress(item._id)}
        activeOpacity={0.7}
      >
        {selectMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
        )}

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => {
            if (selectMode) {
              handleSelect(item._id);
            } else {
              router.push(`/user-profile/${otherUser._id}`);
            }
          }}
          activeOpacity={0.8}
        >
          {otherUser.photos?.length > 0 ? (
            <Image source={{ uri: otherUser.photos[0] }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{otherUser.name[0]}</Text>
            </LinearGradient>
          )}
          {online && <View style={styles.onlineDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.matchInfo}
          onPress={() => {
            if (selectMode) {
              handleSelect(item._id);
            } else {
              router.push(`/chat/${item._id}`);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.matchName}>{otherUser.name}, {otherUser.age}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || '💬 Söhbəti başlat...'}
          </Text>
        </TouchableOpacity>

        <View style={styles.matchMeta}>
          <Text style={styles.time}>{formatTime(item.lastMessageAt || item.createdAt)}</Text>
          {!selectMode && (
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        {selectMode ? (
          <>
            <TouchableOpacity onPress={handleCancelSelect} style={styles.cancelBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedIds.length} seçildi</Text>
            <TouchableOpacity
              onPress={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={22} color={selectedIds.length > 0 ? '#ff4444' : Colors.border} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>💬 Matchlər</Text>
            <Text style={styles.headerCount}>{matches.length} match</Text>
          </>
        )}
      </View>

      {matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💘</Text>
          <Text style={styles.emptyTitle}>Hələ match yoxdur</Text>
          <Text style={styles.emptyText}>Kəşf et səhifəsinə get və swipe et!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item._id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          onRefresh={fetchMatches}
          refreshing={loading}
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
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  headerCount: {
    fontSize: 13,
    color: Colors.white,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 60 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 84 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 2,
  },
  matchCardSelected: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29 },
  avatarPlaceholder: {
    width: 58, height: 58, borderRadius: 29,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  onlineDot: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 12, height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  lastMessage: { fontSize: 13, color: Colors.textLight },
  matchMeta: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11, color: Colors.textLight },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight },
});