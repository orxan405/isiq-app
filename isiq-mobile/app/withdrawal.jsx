import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/axios';
import Colors from '../src/constants/colors';

const MIN_COINS = 500;
const COIN_TO_USD = 100;

export default function Withdrawal() {
  const router = useRouter();
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    coins: '',
    bankCard: '',
    cardHolder: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        api.get('/payment/balance'),
        api.get('/withdrawal/history'),
      ]);
      setCoinBalance(balanceRes.data.coins || 0);
      setHistory(historyRes.data.requests || []);
    } catch (error) {
      console.log('Məlumat xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUSD = (coins) => {
    return (parseInt(coins || 0) / COIN_TO_USD).toFixed(2);
  };

  const handleCardInput = (v) => {
    const cleaned = v.replace(/\s/g, '').replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.replace(/(.{4})/g, '$1 ').trim();
    setForm((p) => ({ ...p, bankCard: formatted }));
  };

  const handleSubmit = async () => {
    const coins = parseInt(form.coins);

    if (!coins || coins < MIN_COINS) {
      Alert.alert('Xəta', `Minimum ${MIN_COINS} coin çıxara bilərsiniz`);
      return;
    }

    if (coins > coinBalance) {
      Alert.alert('Xəta', 'Kifayət qədər coin yoxdur');
      return;
    }

    if (!form.bankCard.trim()) {
      Alert.alert('Xəta', 'Kart nömrəsini daxil edin');
      return;
    }

    if (!form.cardHolder.trim()) {
      Alert.alert('Xəta', 'Kart sahibinin adını daxil edin');
      return;
    }

    Alert.alert(
      '💳 Təsdiq',
      `${coins} coin → $${getUSD(coins)}\nKart: ${form.bankCard}\n\nSorğu göndərilsin?`,
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Bəli',
          onPress: async () => {
            setSubmitting(true);
            try {
              const response = await api.post('/withdrawal/request', {
                coins,
                bankCard: form.bankCard.replace(/\s/g, ''),
                cardHolder: form.cardHolder.trim(),
              });

              setCoinBalance(response.data.coinsLeft);
              setForm({ coins: '', bankCard: '', cardHolder: '' });
              Alert.alert('✅ Uğurlu!', response.data.message);
              fetchData();
            } catch (error) {
              Alert.alert('Xəta', error.response?.data?.message || 'Sorğu göndərilmədi');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#ff4444';
      default: return '#FFA500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '✅ Təsdiqləndi';
      case 'rejected': return '❌ Rədd edildi';
      default: return '⏳ Gözləyir';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('az-AZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💸 Pul Çıxar</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Balans */}
        <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Mövcud Balans</Text>
          <Text style={styles.balanceAmount}>🪙 {coinBalance} Coin</Text>
          <Text style={styles.balanceUSD}>${getUSD(coinBalance)} USD</Text>
          <Text style={styles.balanceNote}>100 coin = $1.00</Text>
        </LinearGradient>

        {/* Minimum xəbərdarlıq */}
        {coinBalance < MIN_COINS && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle" size={20} color="#FFA500" />
            <Text style={styles.warningText}>
              Minimum {MIN_COINS} coin lazımdır. Hədiyyə qəbul edərək coin toplaya bilərsiniz!
            </Text>
          </View>
        )}

        {/* Form */}
        <Text style={styles.sectionTitle}>Çıxarış Sorğusu</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Coin miqdarı (min: {MIN_COINS})</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>🪙</Text>
            <TextInput
              style={styles.input}
              placeholder={`${MIN_COINS} - ${coinBalance}`}
              placeholderTextColor={Colors.textLight}
              value={form.coins}
              onChangeText={(v) => setForm((p) => ({ ...p, coins: v.replace(/\D/g, '') }))}
              keyboardType="numeric"
            />
            {form.coins ? (
              <Text style={styles.inputSuffix}>${getUSD(form.coins)}</Text>
            ) : null}
          </View>

          {/* Sürətli seçim */}
          <View style={styles.quickSelect}>
            {[500, 1000, 2000, 5000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickBtn, coinBalance < amount && styles.quickBtnDisabled]}
                onPress={() => coinBalance >= amount && setForm((p) => ({ ...p, coins: String(amount) }))}
              >
                <Text style={[styles.quickBtnText, coinBalance < amount && styles.quickBtnTextDisabled]}>
                  {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Kart nömrəsi</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="4169 7388 1234 5678"
              placeholderTextColor={Colors.textLight}
              value={form.bankCard}
              onChangeText={handleCardInput}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <Text style={styles.label}>Kart sahibinin adı</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ORXAN QURBANOV"
              placeholderTextColor={Colors.textLight}
              value={form.cardHolder}
              onChangeText={(v) => setForm((p) => ({ ...p, cardHolder: v.toUpperCase() }))}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={16} color={Colors.textLight} />
            <Text style={styles.infoText}>Ödəniş 1-3 iş günü ərzində həyata keçirilir</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (coinBalance < MIN_COINS || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={coinBalance < MIN_COINS || submitting}
          >
            <LinearGradient
              colors={coinBalance >= MIN_COINS ? ['#FF4B6E', '#FF8C5A'] : [Colors.border, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={20} color={Colors.white} />
                  <Text style={styles.submitBtnText}>Sorğu Göndər</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tarixçə */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Çıxarış Tarixçəsi</Text>
            <View style={styles.historyCard}>
              {history.map((item, i) => (
                <View key={item._id}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyCoins}>🪙 {item.coins} coin</Text>
                      <Text style={styles.historyCard2}>💳 {item.bankCard}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>${item.amount}</Text>
                      <Text style={[styles.historyStatus, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>
                  {i < history.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: { padding: 20, paddingBottom: 60, backgroundColor: Colors.background },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold', color: Colors.white, marginBottom: 4 },
  balanceUSD: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  balanceNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  warningText: { flex: 1, fontSize: 13, color: '#8A6200' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  inputPrefix: { fontSize: 18 },
  inputIcon: {},
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  inputSuffix: { fontSize: 14, color: Colors.primary, fontWeight: 'bold' },
  quickSelect: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 4 },
  quickBtn: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quickBtnDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  quickBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  quickBtnTextDisabled: { color: Colors.textLight },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
  },
  infoText: { fontSize: 12, color: Colors.textLight },
  submitBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyLeft: { gap: 4 },
  historyCoins: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  historyCard2: { fontSize: 13, color: Colors.textLight },
  historyDate: { fontSize: 12, color: Colors.textLight },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyAmount: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  historyStatus: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
});