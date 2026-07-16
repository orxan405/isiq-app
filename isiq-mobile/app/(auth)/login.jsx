import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import Colors from '../../src/constants/colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Xəta', 'Email və şifrə daxil edin');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)/discover');
    } else {
      Alert.alert('Xəta', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.topSection}>
          <Text style={styles.logo}>💘</Text>
          <Text style={styles.appName}>İşıq</Text>
          <Text style={styles.tagline}>Sevgiyi tap</Text>
        </LinearGradient>

        <View style={styles.bottomSection}>
          <Text style={styles.welcomeText}>Xoş gəldiniz!</Text>
          <Text style={styles.subText}>Davam etmək üçün daxil olun</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email ünvanınız"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifrəniz"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#FF4B6E', '#FF8C5A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Daxil ol</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>Hesabın yoxdur? </Text>
            <Text style={styles.registerLink}>Qeydiyyatdan keç</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.white },
  topSection: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logo: { fontSize: 72, marginBottom: 8 },
  appName: { fontSize: 42, fontWeight: 'bold', color: Colors.white, letterSpacing: 2 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  bottomSection: { flex: 1, padding: 28, paddingTop: 32 },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 6 },
  subText: { fontSize: 14, color: Colors.textLight, marginBottom: 28 },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  eyeIcon: { padding: 4 },
  buttonWrapper: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  button: { padding: 16, alignItems: 'center', borderRadius: 14 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  registerButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  registerText: { color: Colors.textLight, fontSize: 14 },
  registerLink: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
});