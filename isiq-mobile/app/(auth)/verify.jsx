import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/api/axios';
import Colors from '../../src/constants/colors';

export default function Verify() {
  const { email } = useLocalSearchParams();
  const { login } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Xəta', '6 rəqəmli kodu daxil edin');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify', { email, code: fullCode });

      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data;
        await login(null, null, { accessToken, refreshToken, user });
        router.replace('/(tabs)/discover');
      }
    } catch (error) {
      Alert.alert('Xəta', error.response?.data?.message || 'Kod yanlışdır');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend', { email });
      Alert.alert('✅', 'Yeni kod göndərildi!');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Xəta', error.response?.data?.message || 'Kod göndərilmədi');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.logo}>💘</Text>
        <Text style={styles.headerTitle}>Email Təsdiqi</Text>
        <Text style={styles.headerSubtitle}>
          {email} ünvanına göndərilən kodu daxil edin
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.label}>Təsdiq Kodu</Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(text) => handleChange(text.slice(-1), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={handleVerify}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF4B6E', '#FF8C5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>Təsdiqlə</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Kod gəlmədi? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.resendLink}>Yenidən göndər</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: { position: 'absolute', top: 56, left: 20, padding: 8 },
  logo: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginBottom: 8 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', paddingHorizontal: 32 },
  content: { padding: 28, paddingTop: 36 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  codeInput: {
    width: 48, height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF0F3',
  },
  verifyBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  verifyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  verifyBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: 14, color: Colors.textLight },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: 'bold' },
});