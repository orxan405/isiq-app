import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../src/context/AuthContext';
import Colors from '../../src/constants/colors';
import * as Location from 'expo-location';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    city: '',
    height: '',
    weight: '',
    birthDate: null,
    interestedIn: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        Alert.alert('Xəta', 'Bütün sahələri doldurun');
        return;
      }
      if (form.password.length < 6) {
        Alert.alert('Xəta', 'Şifrə minimum 6 simvol olmalıdır');
        return;
      }
    }
    if (step === 2) {
      if (!form.age || !form.gender || !form.city) {
        Alert.alert('Xəta', 'Bütün sahələri doldurun');
        return;
      }
      if (parseInt(form.age) < 18) {
        Alert.alert('Xəta', 'Yaşınız 18-dən böyük olmalıdır');
        return;
      }
    }
    setStep(step + 1);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.log('Location xətası:', error);
      return null;
    }
  };

  const handleRegister = async () => {
  if (form.interestedIn.length === 0) {
    Alert.alert('Xəta', 'Maraq duyduğunuz cinsi seçin');
    return;
  }
  setLoading(true);
  try {
    const location = await getLocation();
    const result = await register({
      ...form,
      age: parseInt(form.age),
      height: form.height ? parseInt(form.height) : undefined,
      weight: form.weight ? parseInt(form.weight) : undefined,
      location,
    });
    if (result.success) {
      Alert.alert(
        '✅ Uğurlu!',
        'Qeydiyyat tamamlandı! Xoş gəldiniz!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/discover') }]
      );
    } else {
      Alert.alert('Xəta', result.message || 'Qeydiyyat uğursuz oldu');
    }
  } catch (e) {
    Alert.alert('Xəta', e.message);
  } finally {
    setLoading(false);
  }
};

  const toggleInterest = (value) => {
    setForm((prev) => {
      const exists = prev.interestedIn.includes(value);
      return {
        ...prev,
        interestedIn: exists
          ? prev.interestedIn.filter((i) => i !== value)
          : [...prev.interestedIn, value],
      };
    });
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

  const genderIcons = { 'kişi': '👨', 'qadın': '👩', 'digər': '🧑' };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}
          <Text style={styles.logo}>💘</Text>
          <Text style={styles.headerTitle}>Qeydiyyat</Text>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= step && styles.progressDotActive]}
              />
            ))}
          </View>
          <Text style={styles.stepText}>Addım {step} / 3</Text>
        </LinearGradient>

        <View style={styles.formSection}>

          {step === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Hesab məlumatları</Text>
              <Text style={styles.sectionSubtitle}>Gəlin sizi tanıyaq</Text>

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

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifrə (min 6 simvol)"
                  placeholderTextColor={Colors.textLight}
                  value={form.password}
                  onChangeText={(v) => updateForm('password', v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textLight} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.buttonWrapper} onPress={handleNext}>
                <LinearGradient colors={['#FF4B6E', '#FF8C5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                  <Text style={styles.buttonText}>Növbəti</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Şəxsi məlumatlar</Text>
              <Text style={styles.sectionSubtitle}>Bir az özünüz haqqında</Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Yaşınız"
                  placeholderTextColor={Colors.textLight}
                  value={form.age}
                  onChangeText={(v) => updateForm('age', v)}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="gift-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <Text style={[styles.input, !form.birthDate && { color: Colors.textLight }]}>
                  {form.birthDate ? formatDate(form.birthDate) : 'Doğum tarixiniz'}
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

              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={Colors.textLight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şəhər (Bakı, Gəncə...)"
                  placeholderTextColor={Colors.textLight}
                  value={form.city}
                  onChangeText={(v) => updateForm('city', v)}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="resize-outline" size={20} color={Colors.textLight} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Boy (sm)"
                    placeholderTextColor={Colors.textLight}
                    value={form.height}
                    onChangeText={(v) => updateForm('height', v)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputWrapper, styles.halfInput]}>
                  <Ionicons name="fitness-outline" size={20} color={Colors.textLight} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Çəki (kg)"
                    placeholderTextColor={Colors.textLight}
                    value={form.weight}
                    onChangeText={(v) => updateForm('weight', v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Cinsiniz</Text>
              <View style={styles.chipRow}>
                {['kişi', 'qadın', 'digər'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, form.gender === g && styles.chipActive]}
                    onPress={() => updateForm('gender', g)}
                  >
                    <Text style={styles.chipEmoji}>{genderIcons[g]}</Text>
                    <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.buttonWrapper} onPress={handleNext}>
                <LinearGradient colors={['#FF4B6E', '#FF8C5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                  <Text style={styles.buttonText}>Növbəti</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.sectionTitle}>Maraqlarınız</Text>
              <Text style={styles.sectionSubtitle}>Kiminlə tanış olmaq istəyirsiniz?</Text>

              <View style={styles.chipRow}>
                {['kişi', 'qadın', 'digər'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, form.interestedIn.includes(g) && styles.chipActive]}
                    onPress={() => toggleInterest(g)}
                  >
                    <Text style={styles.chipEmoji}>{genderIcons[g]}</Text>
                    <Text style={[styles.chipText, form.interestedIn.includes(g) && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Məlumatlarınız təhlükəsiz saxlanılır</Text>
              </View>

              <TouchableOpacity style={styles.buttonWrapper} onPress={handleRegister} disabled={loading}>
                <LinearGradient colors={['#FF4B6E', '#FF8C5A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Qeydiyyatı Tamamla</Text>
                      <Ionicons name="checkmark" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>Artıq hesabın var? </Text>
            <Text style={styles.loginLinkText}>Daxil ol</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.white },
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: { position: 'absolute', top: 56, left: 20, padding: 8 },
  logo: { fontSize: 40, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginBottom: 16 },
  progressContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressDot: { width: 32, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  progressDotActive: { backgroundColor: Colors.white },
  stepText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  formSection: { padding: 24, paddingTop: 28 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  label: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F3' },
  chipEmoji: { fontSize: 24, marginBottom: 4 },
  chipText: { fontSize: 13, color: Colors.text },
  chipTextActive: { color: Colors.primary, fontWeight: 'bold' },
  buttonWrapper: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  button: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: { fontSize: 13, color: Colors.primary, flex: 1 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: Colors.textLight, fontSize: 14 },
  loginLinkText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
});