import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, Dimensions, Alert,
  StatusBar, Modal, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/axios';
import Colors from '../../src/constants/colors';

const { width } = Dimensions.get('window');

const INTERESTS = [
  { id: 'music', label: 'Musiqi', emoji: '🎵' },
  { id: 'cinema', label: 'Kino', emoji: '🎬' },
  { id: 'sport', label: 'İdman', emoji: '⚽' },
  { id: 'book', label: 'Kitab', emoji: '📚' },
  { id: 'food', label: 'Yemək', emoji: '🍕' },
  { id: 'travel', label: 'Səyahət', emoji: '✈️' },
  { id: 'game', label: 'Oyun', emoji: '🎮' },
  { id: 'dance', label: 'Rəqs', emoji: '💃' },
  { id: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { id: 'art', label: 'Sənət', emoji: '🎨' },
  { id: 'photo', label: 'Foto', emoji: '📸' },
  { id: 'animal', label: 'Heyvan', emoji: '🐾' },
  { id: 'nature', label: 'Təbiət', emoji: '🌿' },
  { id: 'tech', label: 'Texnologiya', emoji: '💻' },
  { id: 'fashion', label: 'Moda', emoji: '👗' },
  { id: 'cooking', label: 'Bişirmək', emoji: '👨‍🍳' },
];

export default function Discover() {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModal, setMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    city: '',
    interests: [],
  });
  const [tempFilters, setTempFilters] = useState({
    minAge: '',
    maxAge: '',
    city: '',
    interests: [],
  });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    fetchUnreadNotifCount();
    const interval = setInterval(fetchUnreadNotifCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (customFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (customFilters.minAge) params.append('minAge', customFilters.minAge);
      if (customFilters.maxAge) params.append('maxAge', customFilters.maxAge);
      if (customFilters.city) params.append('city', customFilters.city);
      if (customFilters.interests?.length > 0) {
        params.append('interests', customFilters.interests.join(','));
      }

      const response = await api.get(`/users/discover?${params.toString()}`);
      setUsers(response.data.users);
      setCurrentIndex(0);
    } catch (error) {
      Alert.alert('Xəta', 'İstifadəçilər yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadNotifCount(response.data.count || 0);
    } catch (error) {
      console.log('Bildiriş sayı xətası:', error.message);
    }
  };

  const handleLike = async () => {
    const user = users[currentIndex];
    if (!user) return;
    try {
      const response = await api.post(`/matches/like/${user._id}`);
      if (response.data.isMatch) {
        setMatchedUser(user);
        setMatchId(response.data.match._id);
        setMatchModal(true);
      }
    } catch (error) {
      console.log('like xətası:', error);
    }
    nextUser();
  };

  const handleDislike = async () => {
    const user = users[currentIndex];
    if (!user) return;
    try {
      await api.post(`/matches/dislike/${user._id}`);
    } catch (error) {
      console.log('dislike xətası:', error);
    }
    nextUser();
  };

  const handleSuperLike = async () => {
    const user = users[currentIndex];
    if (!user) return;
    try {
      const response = await api.post(`/matches/superlike/${user._id}`);
      Alert.alert(
        '⭐ Super Like!',
        `${user.name}-ə Super Like göndərildi! ${response.data.coinsLeft} coin qaldı.`
      );
    } catch (error) {
      if (error.response?.status === 402) {
        Alert.alert(
          '🪙 Coin Lazımdır',
          'Super Like üçün 5 coin lazımdır. Coin almaq istəyirsiniz?',
          [
            { text: 'Xeyr', style: 'cancel' },
            { text: 'Coin Al', onPress: () => router.push('/coin-shop') },
          ]
        );
      } else {
        Alert.alert('Xəta', 'Super Like göndərilmədi');
      }
    }
    nextUser();
  };

  const nextUser = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setUsers([]);
    }
  };

  const openFilter = () => {
    setTempFilters({ ...filters });
    setShowFilter(true);
  };

  const applyFilter = () => {
    setFilters({ ...tempFilters });
    setShowFilter(false);
    fetchUsers(tempFilters);
  };

  const resetFilter = () => {
    const empty = { minAge: '', maxAge: '', city: '', interests: [] };
    setTempFilters(empty);
    setFilters(empty);
    setShowFilter(false);
    fetchUsers(empty);
  };

  const toggleInterest = (id) => {
    const current = tempFilters.interests;
    if (current.includes(id)) {
      setTempFilters((p) => ({ ...p, interests: current.filter((i) => i !== id) }));
    } else {
      setTempFilters((p) => ({ ...p, interests: [...current, id] }));
    }
  };

  const hasFilters = filters.minAge || filters.maxAge || filters.city || filters.interests.length > 0;

  const currentUser = users[currentIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Profillər yüklənir...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>Yeni profil yoxdur</Text>
        <Text style={styles.emptyText}>Bir az sonra yenidən bax</Text>
        <TouchableOpacity onPress={() => fetchUsers()}>
          <LinearGradient colors={['#FF4B6E', '#FF8C5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.refreshButton}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.refreshText}>Yenilə</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerLogo}>💘</Text>
        <Text style={styles.headerTitle}>İşıq</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, hasFilters && styles.iconBtnActive]}
            onPress={openFilter}
          >
            <Ionicons name="options-outline" size={22} color={hasFilters ? Colors.white : Colors.text} />
            {hasFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setUnreadNotifCount(0);
              router.push('/notifications');
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.95}
          onPress={() => router.push(`/user-profile/${currentUser._id}`)}
        >
          {currentUser.photos?.length > 0 && !currentUser.photos[0].includes('/video/') ? (
            <Image source={{ uri: currentUser.photos[0] }} style={styles.photo} />
          ) : (
            <LinearGradient colors={['#f0f0f0', '#e0e0e0']} style={styles.noPhoto}>
              <Text style={styles.noPhotoText}>📷</Text>
              <Text style={styles.noPhotoLabel}>Şəkil yoxdur</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.overlay}
          >
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{currentUser.name}</Text>
                <Text style={styles.age}>{currentUser.age}</Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.city}>{currentUser.city}</Text>
              </View>
              {currentUser.bio ? (
                <Text style={styles.bio} numberOfLines={2}>{currentUser.bio}</Text>
              ) : null}
              {currentUser.interests?.length > 0 && (
                <View style={styles.interests}>
                  {currentUser.interests.slice(0, 3).map((interestId, i) => {
                    const interest = INTERESTS.find((x) => x.id === interestId);
                    return (
                      <View key={i} style={styles.interestChip}>
                        <Text style={styles.interestText}>
                          {interest ? `${interest.emoji} ${interest.label}` : interestId}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={styles.tapHint}>
                <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.tapHintText}>Profilə baxmaq üçün toxun</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.dislikeBtn} onPress={handleDislike}>
          <Ionicons name="close" size={34} color="#FF4B6E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.superLikeBtn} onPress={handleSuperLike}>
          <Ionicons name="star" size={26} color="#6C63FF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
          <Ionicons name="heart" size={34} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <Text style={styles.remaining}>
        {users.length - currentIndex - 1} profil qalıb
      </Text>

      {/* Match Modal */}
      <Modal
        visible={matchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setMatchModal(false)}
      >
        <View style={styles.matchModalOverlay}>
          <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.matchModalCard}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>Match oldunuz!</Text>
            <Text style={styles.matchSubtitle}>
              Siz və {matchedUser?.name} bir-birinizi bəyəndiniz!
            </Text>

            <View style={styles.matchAvatars}>
              <View style={styles.matchAvatarWrapper}>
                {matchedUser?.photos?.length > 0 ? (
                  <Image source={{ uri: matchedUser.photos[0] }} style={styles.matchAvatar} />
                ) : (
                  <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                    <Text style={styles.matchAvatarText}>{matchedUser?.name?.[0]}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.matchHeart}>❤️</Text>
              <View style={styles.matchAvatarWrapper}>
                <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                  <Text style={styles.matchAvatarText}>Sən</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.matchChatBtn}
              onPress={() => {
                setMatchModal(false);
                if (matchId) router.push(`/chat/${matchId}`);
              }}
            >
              <Text style={styles.matchChatBtnText}>💬 Söhbəti Başlat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.matchLaterBtn} onPress={() => setMatchModal(false)}>
              <Text style={styles.matchLaterBtnText}>Sonra</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Filtr Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.filterOverlay}>
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>🔍 Filtr</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Yaş */}
              <Text style={styles.filterLabel}>Yaş aralığı</Text>
              <View style={styles.filterRow}>
                <View style={[styles.filterInput, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.filterInputLabel}>Minimum</Text>
                  <View style={styles.filterInputWrapper}>
                    <Text
                      style={styles.filterInputText}
                      onPress={() => {
                        const val = prompt?.('Min yaş:') || '';
                        setTempFilters((p) => ({ ...p, minAge: val }));
                      }}
                    >
                      {tempFilters.minAge || '18'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.filterInput, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.filterInputLabel}>Maksimum</Text>
                  <View style={styles.filterInputWrapper}>
                    <Text style={styles.filterInputText}>
                      {tempFilters.maxAge || '80'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Yaş slider əvəzinə sadə seçim */}
              <View style={styles.ageButtons}>
                {[[18, 25], [25, 35], [35, 45], [45, 80]].map(([min, max]) => (
                  <TouchableOpacity
                    key={`${min}-${max}`}
                    style={[
                      styles.ageBtn,
                      tempFilters.minAge == min && tempFilters.maxAge == max && styles.ageBtnActive,
                    ]}
                    onPress={() => setTempFilters((p) => ({ ...p, minAge: String(min), maxAge: String(max) }))}
                  >
                    <Text style={[
                      styles.ageBtnText,
                      tempFilters.minAge == min && tempFilters.maxAge == max && styles.ageBtnTextActive,
                    ]}>
                      {min}-{max}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Maraqlar */}
              <Text style={styles.filterLabel}>Maraqlar</Text>
              <View style={styles.filterInterests}>
                {INTERESTS.map((interest) => {
                  const isSelected = tempFilters.interests.includes(interest.id);
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      style={[styles.filterInterestChip, isSelected && styles.filterInterestChipActive]}
                      onPress={() => toggleInterest(interest.id)}
                    >
                      <Text style={styles.filterInterestEmoji}>{interest.emoji}</Text>
                      <Text style={[styles.filterInterestLabel, isSelected && styles.filterInterestLabelActive]}>
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
                <Text style={styles.resetBtnText}>Sıfırla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtnWrapper} onPress={applyFilter}>
                <LinearGradient
                  colors={['#FF4B6E', '#FF8C5A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyBtn}
                >
                  <Text style={styles.applyBtnText}>Tətbiq et</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textLight, marginTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerLogo: { fontSize: 28 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBtnActive: { backgroundColor: Colors.primary },
  filterDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FFC107',
  },
  notifBadge: {
    position: 'absolute',
    top: -4, right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  notifBadgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  cardContainer: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
  card: {
    flex: 1, borderRadius: 24, overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  noPhoto: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noPhotoText: { fontSize: 64 },
  noPhotoLabel: { fontSize: 14, color: Colors.textLight, marginTop: 8 },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
  },
  cardInfo: {},
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  name: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  age: { fontSize: 22, color: 'rgba(255,255,255,0.9)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  city: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  interestText: { fontSize: 12, color: Colors.white },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  tapHintText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  buttons: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 20,
    paddingVertical: 16, paddingHorizontal: 20,
  },
  dislikeBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF4B6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  superLikeBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  likeBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  remaining: { textAlign: 'center', fontSize: 12, color: Colors.textLight, paddingBottom: 8 },
  emptyEmoji: { fontSize: 72, marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  refreshText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  matchModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  matchModalCard: { width: '100%', borderRadius: 28, padding: 32, alignItems: 'center' },
  matchEmoji: { fontSize: 64, marginBottom: 12 },
  matchTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.white, marginBottom: 8 },
  matchSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 28 },
  matchAvatars: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  matchAvatarWrapper: {},
  matchAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.white },
  matchAvatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  matchAvatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  matchHeart: { fontSize: 36 },
  matchChatBtn: {
    backgroundColor: Colors.white, borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 16,
    marginBottom: 12, width: '100%', alignItems: 'center',
  },
  matchChatBtnText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  matchLaterBtn: { paddingVertical: 8 },
  matchLaterBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  filterOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  filterHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  filterTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  filterLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12, marginTop: 16 },
  filterRow: { flexDirection: 'row' },
  filterInput: {},
  filterInputLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 6 },
  filterInputWrapper: {
    backgroundColor: Colors.background,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterInputText: { fontSize: 15, color: Colors.text },
  ageButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  ageBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  ageBtnActive: { backgroundColor: '#FFF0F3', borderColor: Colors.primary },
  ageBtnText: { fontSize: 13, color: Colors.text },
  ageBtnTextActive: { color: Colors.primary, fontWeight: '600' },
  filterInterests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterInterestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterInterestChipActive: { backgroundColor: '#FFF0F3', borderColor: Colors.primary },
  filterInterestEmoji: { fontSize: 14 },
  filterInterestLabel: { fontSize: 12, color: Colors.text },
  filterInterestLabelActive: { color: Colors.primary, fontWeight: '600' },
  filterActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  resetBtn: {
    flex: 1, padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  applyBtnWrapper: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  applyBtn: { padding: 14, alignItems: 'center', borderRadius: 14 },
  applyBtnText: { fontSize: 15, color: Colors.white, fontWeight: 'bold' },
});