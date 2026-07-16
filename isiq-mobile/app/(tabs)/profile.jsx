import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, StatusBar,
  FlatList, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/api/axios';
import Colors from '../../src/constants/colors';

const { width } = Dimensions.get('window');
const GALLERY_PADDING = 16;
const GALLERY_GAP = 8;
const ITEM_SIZE = (width - GALLERY_PADDING * 2 - GALLERY_GAP * 2) / 3;
const MAX_MEDIA = 6;

function VideoModalPlayer({ uri }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <VideoView
      style={styles.modalImage}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [matchCount, setMatchCount] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/matches');
        setMatchCount(response.data.count || 0);
      } catch (error) {
        console.log('Stats xətası:', error);
      }
    };
    fetchStats();
  }, []);

  const isVideoUrl = (url) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('/video/');
  };

  const mediaCount = user?.photos?.length || 0;
  const isLimitReached = mediaCount >= MAX_MEDIA;

  const handlePickMedia = async (type = 'images') => {
    if (isLimitReached) {
      Alert.alert('Limit doldu', `Maksimum ${MAX_MEDIA} media yükləyə bilərsiniz`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə lazımdır', 'Media yükləmək üçün qalereya icazəsi verin');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'images' ? ['images'] : ['videos'],
      allowsEditing: type === 'images',
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadMedia(result.assets[0], type);
    }
  };

  const uploadMedia = async (asset, type) => {
    try {
      setUploading(true);
      setUploadType(type);
      const formData = new FormData();
      const isVideo = type === 'videos';

      formData.append('photo', {
        uri: asset.uri,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        name: isVideo ? 'video.mp4' : 'photo.jpg',
      });

      const response = await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        await updateUser({ photos: response.data.photos });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Media yüklənmədi';
      Alert.alert('Xəta', message);
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  const handleDeleteMedia = async (photoUrl) => {
    Alert.alert(
      'Sil',
      'Bu mediyanı silmək istəyirsiniz?',
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete('/upload/photo', {
                data: { photoUrl },
              });
              if (response.data.success) {
                await updateUser({ photos: response.data.photos });
              }
            } catch (error) {
              Alert.alert('Xəta', 'Silinmədi');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıxış',
      'Çıxmaq istədiyinizdən əminsiniz?',
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Bəli',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.log('Logout xətası:', error);
            } finally {
              router.replace('/(auth)/login');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderMediaItem = ({ item, index }) => {
    const isVideo = isVideoUrl(item);
    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => setSelectedMedia(item)}
        onLongPress={() => handleDeleteMedia(item)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item }} style={styles.mediaThumb} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={styles.mediaGradient}
        />
        {isVideo && (
          <View style={styles.videoOverlay}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={16} color={Colors.white} />
            </View>
          </View>
        )}
        {index === 0 && (
          <View style={styles.mainBadge}>
            <Ionicons name="star" size={10} color={Colors.white} />
            <Text style={styles.mainBadgeText}>Əsas</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAddTile = () => (
    <TouchableOpacity
      style={[styles.mediaItem, styles.addTile]}
      onPress={() => handlePickMedia('images')}
      activeOpacity={0.7}
    >
      <Ionicons name="add" size={28} color={Colors.primary} />
      <Text style={styles.addTileText}>Əlavə et</Text>
    </TouchableOpacity>
  );

  if (!user) return null;

  const galleryData = isLimitReached ? user.photos : [...(user.photos || []), '__add__'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => user.photos?.[0] && setSelectedMedia(user.photos[0])}
            activeOpacity={0.85}
          >
            {user.photos?.length > 0 ? (
              <Image source={{ uri: user.photos[0] }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user.name[0]}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editAvatarBtn}
            onPress={() => handlePickMedia('images')}
          >
            <Ionicons name="camera" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{user.name}, {user.age}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.city}>{user.city}</Text>
        </View>

        {user.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mediaCount}</Text>
          <Text style={styles.statLabel}>Media</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{matchCount}</Text>
          <Text style={styles.statLabel}>Match</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{matchCount}</Text>
          <Text style={styles.statLabel}>Söhbət</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.galleryHeader}>
          <View>
            <Text style={styles.sectionTitle}>Qalereya</Text>
            <Text style={styles.galleryLimit}>{mediaCount}/{MAX_MEDIA} media</Text>
          </View>
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={[styles.addMediaBtn, isLimitReached && styles.addMediaBtnDisabled]}
              onPress={() => handlePickMedia('images')}
              disabled={uploading || isLimitReached}
            >
              <Ionicons name="image-outline" size={16} color={isLimitReached ? Colors.textLight : Colors.primary} />
              <Text style={[styles.addMediaText, isLimitReached && styles.addMediaTextDisabled]}>Şəkil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addMediaBtn, isLimitReached && styles.addMediaBtnDisabled]}
              onPress={() => handlePickMedia('videos')}
              disabled={uploading || isLimitReached}
            >
              <Ionicons name="videocam-outline" size={16} color={isLimitReached ? Colors.textLight : Colors.secondary} />
              <Text style={[styles.addMediaText, { color: Colors.secondary }, isLimitReached && styles.addMediaTextDisabled]}>Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {uploading && (
          <View style={styles.uploadingBanner}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadingText}>
              {uploadType === 'videos' ? 'Video' : 'Şəkil'} yüklənir...
            </Text>
          </View>
        )}

        {isLimitReached && (
          <View style={styles.limitBanner}>
            <Ionicons name="information-circle" size={16} color="#E68A00" />
            <Text style={styles.limitBannerText}>Maksimum limitə çatdınız</Text>
          </View>
        )}

        {mediaCount > 0 ? (
          <View style={styles.gallery}>
            <FlatList
              data={galleryData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) =>
                item === '__add__' ? renderAddTile() : renderMediaItem({ item, index })
              }
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
            />
          </View>
        ) : (
          !uploading && (
            <TouchableOpacity
              style={styles.emptyGallery}
              onPress={() => handlePickMedia('images')}
              activeOpacity={0.7}
            >
              <View style={styles.emptyIconCircle}>
                <Ionicons name="images-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.emptyGalleryText}>Hələ media yoxdur</Text>
              <Text style={styles.emptyGallerySubtext}>Şəkil və ya video əlavə et</Text>
            </TouchableOpacity>
          )
        )}

        {mediaCount > 0 && (
          <Text style={styles.galleryHint}>Silmək üçün uzun bas</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Məlumatlar</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF0F3' }]}>
                <Ionicons name="mail-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#F0F0FF' }]}>
                <Ionicons name="person-outline" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.infoLabel}>Cins</Text>
            </View>
            <Text style={styles.infoValue}>{user.gender}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#F0FFF4' }]}>
                <Ionicons name="location-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.infoLabel}>Şəhər</Text>
            </View>
            <Text style={styles.infoValue}>{user.city}</Text>
          </View>
          {user.height && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: '#FFE8F0' }]}>
                    <Ionicons name="resize-outline" size={18} color="#E91E63" />
                  </View>
                  <Text style={styles.infoLabel}>Boy</Text>
                </View>
                <Text style={styles.infoValue}>{user.height} sm</Text>
              </View>
            </>
          )}
          {user.weight && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="fitness-outline" size={18} color="#43A047" />
                  </View>
                  <Text style={styles.infoLabel}>Çəki</Text>
                </View>
                <Text style={styles.infoValue}>{user.weight} kg</Text>
              </View>
            </>
          )}
          {user.birthDate && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="gift-outline" size={18} color="#FB8C00" />
                  </View>
                  <Text style={styles.infoLabel}>Doğum tarixi</Text>
                </View>
                <Text style={styles.infoValue}>
                  {new Date(user.birthDate).toLocaleDateString('az-AZ')}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tənzimləmələr</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/edit-profile')}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF0F3' }]}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>Məlumatlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/coin-shop')}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="star-outline" size={18} color="#FFC107" />
              </View>
              <Text style={styles.infoLabel}>Premium al</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/withdrawal')}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.infoLabel}>Coin Cüzdanı</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#F0F0FF' }]}>
                <Ionicons name="shield-outline" size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.infoLabel}>Məxfilik</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: '#F0FFF4' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.infoLabel}>Yardım</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
        <Text style={styles.logoutText}>Çıxış</Text>
      </TouchableOpacity>

      <Text style={styles.version}>İşıq v1.0.0</Text>

      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setSelectedMedia(null)}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
          {selectedMedia && (
            isVideoUrl(selectedMedia) ? (
              <VideoModalPlayer uri={selectedMedia} />
            ) : (
              <Image
                source={{ uri: selectedMedia }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 60 },
  header: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  avatarInitial: { fontSize: 36, fontWeight: 'bold', color: Colors.white },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  city: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: { color: Colors.white, fontWeight: 'bold', fontSize: 13 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 2 },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  galleryLimit: { fontSize: 12, color: Colors.textLight },
  mediaButtons: { flexDirection: 'row', gap: 8 },
  addMediaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  addMediaBtnDisabled: { opacity: 0.5 },
  addMediaText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  addMediaTextDisabled: { color: Colors.textLight },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  uploadingText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  limitBannerText: { fontSize: 13, color: '#8A6200' },
  gallery: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: GALLERY_PADDING,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { gap: GALLERY_GAP, marginBottom: GALLERY_GAP },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F3F5',
  },
  mediaThumb: { width: '100%', height: '100%' },
  mediaGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '40%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  playCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  mainBadge: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  mainBadgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  addTile: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addTileText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  emptyGallery: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  emptyGalleryText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyGallerySubtext: { fontSize: 13, color: Colors.textLight },
  galleryHint: { fontSize: 11, color: Colors.textLight, marginTop: 10, textAlign: 'center' },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 15, color: Colors.text },
  infoValue: { fontSize: 14, color: Colors.textLight, maxWidth: 160 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ffeeee',
  },
  logoutText: { color: '#ff4444', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: Colors.border, marginTop: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
});