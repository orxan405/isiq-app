import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/api/axios';
import Colors from '../src/constants/colors';

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

const genderIcons = { 'kişi': '👨', 'qadın': '👩', 'digər': '🧑' };

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    city: user?.city || '',
    job: user?.job || '',
    education: user?.education || '',
    height: user?.height ? String(user.height) : '',
    weight: user?.weight ? String(user.weight) : '',
    birthDate: user?.birthDate ? new Date(user.birthDate) : null,
    gender: user?.gender || 'kişi',
    interests: user?.interests || [],
  });

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleInterest = (id) => {
    const current = form.interests;
    if (current.includes(id)) {
      updateForm('interests', current.filter((i) => i !== id));
    } else {
      if (current.length >= 10) {
        Alert.alert('Limit', 'Maksimum 10 maraq seçə bilərsiniz');
        return;
      }
      updateForm('interests', [...current, id]);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateForm('birthDate', selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      Alert.alert('Xəta', 'Ad və şəhər tələb olunur');
      return;
    }

    if (!form.email.trim()) {
      Alert.alert('Xəta', 'Email tələb olunur');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile/update', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        job: form.job.trim(),
        education: form.education.trim(),
        height: form.height ? parseInt(form.height) : undefined,
        weight: form.weight ? parseInt(form.weight) : undefined,
        birthDate: form.birthDate,
        interests: form.interests,
      });

      if (response.data.success) {
        await updateUser(response.data.user);
        Alert.alert('✅ Uğurlu', 'Profil yeniləndi!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Xəta', error.response?.data?.message || 'Yenilənmədi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Redaktə Et</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.label}>Ad</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Adınız"
              placeholderTextColor={Colors.textLight}
              value={form.name}
              onChangeText={(v) => updateForm('name', v)}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email ünvanınız"
              placeholderTextColor={Colors.textLight}
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Doğum tarixi</Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="gift-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <Text style={[styles.input, !form.birthDate && { color: Colors.textLight }]}>
              {form.birthDate ? formatDate(form.birthDate) : 'Doğum tarixinizi seçin'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.birthDate || new Date(2000, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          <Text style={styles.label}>Haqqımda</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Özünüz haqqında qısa məlumat..."
              placeholderTextColor={Colors.textLight}
              value={form.bio}
              onChangeText={(v) => updateForm('bio', v)}
              multiline
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{form.bio.length}/500</Text>

          <Text style={styles.label}>Şəhər</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Bakı, Gəncə..."
              placeholderTextColor={Colors.textLight}
              value={form.city}
              onChangeText={(v) => updateForm('city', v)}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.colInput, { marginRight: 5 }]}>
              <Text style={styles.label}>Boy (sm)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="resize-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="175"
                  placeholderTextColor={Colors.textLight}
                  value={form.height}
                  onChangeText={(v) => updateForm('height', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.colInput, { marginLeft: 5 }]}>
              <Text style={styles.label}>Çəki (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="fitness-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor={Colors.textLight}
                  value={form.weight}
                  onChangeText={(v) => updateForm('weight', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>İş</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Peşəniz"
              placeholderTextColor={Colors.textLight}
              value={form.job}
              onChangeText={(v) => updateForm('job', v)}
            />
          </View>

          <Text style={styles.label}>Təhsil</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="school-outline" size={20} color={Colors.textLight} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Universitet, ixtisas..."
              placeholderTextColor={Colors.textLight}
              value={form.education}
              onChangeText={(v) => updateForm('education', v)}
            />
          </View>

          {/* Maraqlar */}
          <View style={styles.interestHeader}>
            <Text style={styles.label}>Maraqlar</Text>
            <Text style={styles.interestCount}>{form.interests.length}/10</Text>
          </View>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => {
              const isSelected = form.interests.includes(interest.id);
              return (
                <TouchableOpacity
                  key={interest.id}
                  style={[styles.interestChip, isSelected && styles.interestChipActive]}
                  onPress={() => toggleInterest(interest.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                  <Text style={[styles.interestLabel, isSelected && styles.interestLabelActive]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Cins</Text>
          <View style={styles.chipRow}>
            {['kişi', 'qadın', 'digər'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                disabled
              >
                <Text style={styles.chipEmoji}>{genderIcons[g]}</Text>
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.note}>Cins qeydiyyatdan sonra dəyişdirilə bilməz</Text>

          <TouchableOpacity style={styles.saveBtnWrapper} onPress={handleSave} disabled={loading}>
            <LinearGradient
              colors={['#FF4B6E', '#FF8C5A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>{loading ? 'Yenilənir...' : 'Yadda saxla'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 60 },
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 16 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaWrapper: { alignItems: 'flex-start', paddingVertical: 12 },
  rowInputs: { flexDirection: 'row' },
  colInput: { flex: 1 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  textArea: { paddingVertical: 0, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textLight, textAlign: 'right', marginTop: 4 },
  interestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  interestCount: { fontSize: 12, color: Colors.textLight },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  interestChipActive: {
    backgroundColor: '#FFF0F3',
    borderColor: Colors.primary,
  },
  interestEmoji: { fontSize: 16 },
  interestLabel: { fontSize: 13, color: Colors.text },
  interestLabelActive: { color: Colors.primary, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    opacity: 0.6,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F3', opacity: 1 },
  chipEmoji: { fontSize: 22, marginBottom: 4 },
  chipText: { fontSize: 12, color: Colors.text },
  chipTextActive: { color: Colors.primary, fontWeight: 'bold' },
  note: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
  saveBtnWrapper: { marginTop: 28, borderRadius: 14, overflow: 'hidden' },
  saveBtn: { padding: 16, alignItems: 'center', borderRadius: 14 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});