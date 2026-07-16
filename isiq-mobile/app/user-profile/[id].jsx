import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator,
  StatusBar, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/axios';
import Colors from '../../src/constants/colors';

const { width } = Dimensions.get('window');

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      console.log('İstifadəçi xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>İstifadəçi tapılmadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      <View style={styles.photoSection}>
        {user.photos?.length > 0 ? (
          <Image source={{ uri: user.photos[activePhoto] }} style={styles.mainPhoto} />
        ) : (
          <LinearGradient colors={['#f0f0f0', '#e0e0e0']} style={styles.noPhoto}>
            <Text style={styles.noPhotoEmoji}>📷</Text>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={styles.topGradient}
        />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        {user.photos?.length > 1 && (
          <View style={styles.photoIndicators}>
            {user.photos.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.indicator, i === activePhoto && styles.indicatorActive]}
                onPress={() => setActivePhoto(i)}
              />
            ))}
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}, {user.age}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.city}>{user.city}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        {user.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Haqqında</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Məlumatlar</Text>
          <View style={styles.detailsGrid}>
            {user.height && (
              <View style={styles.detailItem}>
                <Ionicons name="resize-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailText}>{user.height} sm</Text>
              </View>
            )}
            {user.weight && (
              <View style={styles.detailItem}>
                <Ionicons name="fitness-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailText}>{user.weight} kg</Text>
              </View>
            )}
            {user.job && (
              <View style={styles.detailItem}>
                <Ionicons name="briefcase-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailText}>{user.job}</Text>
              </View>
            )}
            {user.education && (
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={18} color={Colors.primary} />
                <Text style={styles.detailText}>{user.education}</Text>
              </View>
            )}
          </View>
        </View>

        {user.interests?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maraqlar</Text>
            <View style={styles.interestsRow}>
              {user.interests.map((interest, i) => (
                <View key={i} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {user.photos?.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bütün şəkillər</Text>
            <View style={styles.photoGrid}>
              {user.photos.map((photo, i) => (
                <TouchableOpacity key={i} onPress={() => setActivePhoto(i)}>
                  <Image source={{ uri: photo }} style={styles.gridPhoto} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoSection: { width: '100%', height: width * 1.2, position: 'relative' },
  mainPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  noPhoto: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  noPhotoEmoji: { fontSize: 64 },
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
  },
  backBtn: {
    position: 'absolute', top: 50, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  photoIndicators: {
    position: 'absolute', top: 50, left: 70, right: 16,
    flexDirection: 'row', gap: 4,
  },
  indicator: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  indicatorActive: { backgroundColor: Colors.white },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
  },
  nameRow: { marginBottom: 4 },
  name: { fontSize: 26, fontWeight: 'bold', color: Colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 10 },
  bioText: { fontSize: 15, color: Colors.textLight, lineHeight: 22 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  detailText: { fontSize: 14, color: Colors.text },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16,
  },
  interestText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridPhoto: {
    width: (width - 40 - 16) / 3,
    height: (width - 40 - 16) / 3,
    borderRadius: 10,
  },
});