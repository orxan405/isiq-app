import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, ActivityIndicator,
  Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../src/api/axios';
import Colors from '../src/constants/colors';

const PACKAGES = [
  {
    id: 'small',
    coins: 50,
    price: '2.99',
    amount: 299,
    emoji: '🪙',
    label: '50 Coin',
    description: '10 Super Like',
    color: ['#FFD700', '#FFA500'],
  },
  {
    id: 'medium',
    coins: 150,
    price: '6.99',
    amount: 699,
    emoji: '💰',
    label: '150 Coin',
    description: '30 Super Like',
    color: ['#C0C0C0', '#A0A0A0'],
    popular: true,
  },
  {
    id: 'large',
    coins: 500,
    price: '17.99',
    amount: 1799,
    emoji: '💎',
    label: '500 Coin',
    description: '100 Super Like',
    color: ['#6C63FF', '#4B44CC'],
  },
];

const USES = [
  { emoji: '⭐', title: 'Super Like', desc: 'Xüsusi bəyənmə göndər', cost: '5 coin' },
  { emoji: '🌹', title: 'Qızılgül', desc: 'Hədiyyə göndər', cost: '10 coin' },
  { emoji: '🍫', title: 'Şokolad', desc: 'Hədiyyə göndər', cost: '15 coin' },
  { emoji: '🎁', title: 'Hədiyyə qutusu', desc: 'Hədiyyə göndər', cost: '20 coin' },
  { emoji: '💐', title: 'Buket', desc: 'Hədiyyə göndər', cost: '30 coin' },
  { emoji: '🧸', title: 'Oyuncaq ayı', desc: 'Hədiyyə göndər', cost: '35 coin' },
  { emoji: '🍰', title: 'Tort', desc: 'Hədiyyə göndər', cost: '40 coin' },
  { emoji: '💎', title: 'Brilyant', desc: 'Hədiyyə göndər', cost: '45 coin' },
  { emoji: '💍', title: 'Üzük', desc: 'Hədiyyə göndər', cost: '50 coin' },
  { emoji: '✈️', title: 'Səyahət', desc: 'Hədiyyə göndər', cost: '100 coin' },
];

export default function CoinShop() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/payment/balance');
      setBalance(response.data.coins || 0);
    } catch (error) {
      console.log('Balans xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pkg) => {
    setSelectedPkg(pkg);
    setBuying(true);

    try {
      // Payment Intent yarat
      const intentRes = await api.post('/payment/create-intent', {
        package: pkg.id,
      });

      const { clientSecret, paymentIntentId } = intentRes.data;

      // Payment Sheet başlat
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'İşıq App',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: 'İşıq İstifadəçisi',
        },
        appearance: {
          colors: {
            primary: '#FF4B6E',
          },
        },
      });

      if (initError) {
        Alert.alert('Xəta', initError.message);
        return;
      }

      // Payment Sheet göstər
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Ödəniş xətası', presentError.message);
        }
        return;
      }

      // Ödənişi təsdiqlə
      await api.post('/payment/confirm', {
        paymentIntentId,
        package: pkg.id,
      });

      setBalance((prev) => prev + pkg.coins);
      Alert.alert('✅ Uğurlu!', `${pkg.coins} coin hesabınıza əlavə edildi!`);
    } catch (error) {
      Alert.alert('Xəta', error.response?.data?.message || 'Ödəniş uğursuz oldu');
    } finally {
      setBuying(false);
      setSelectedPkg(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🪙 Coin Mağazası</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Balans */}
        <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Mövcud Balans</Text>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.balanceAmount}>🪙 {balance} Coin</Text>
          )}
        </LinearGradient>

        {/* Coin Paketləri */}
        <Text style={styles.sectionTitle}>Coin Paketləri</Text>
        {PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={styles.packageCard}
            onPress={() => handleBuy(pkg)}
            disabled={buying}
            activeOpacity={0.8}
          >
            <LinearGradient colors={pkg.color} style={styles.packageIcon}>
              <Text style={styles.packageEmoji}>{pkg.emoji}</Text>
            </LinearGradient>

            <View style={styles.packageInfo}>
              <View style={styles.packageTitleRow}>
                <Text style={styles.packageLabel}>{pkg.label}</Text>
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Populyar</Text>
                  </View>
                )}
              </View>
              <Text style={styles.packageDesc}>{pkg.description}</Text>
            </View>

            <View style={styles.packagePrice}>
              {buying && selectedPkg?.id === pkg.id ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Text style={styles.priceText}>${pkg.price}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.border} />
                </>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Test kartı */}
        <View style={styles.testCard}>
          <Ionicons name="card-outline" size={18} color={Colors.textLight} />
          <Text style={styles.testCardText}>Test kartı: 4242 4242 4242 4242 | 12/34 | 123</Text>
        </View>

        {/* Coin nə üçün? */}
        <Text style={styles.sectionTitle}>Coin ilə nə edə bilərsən?</Text>
        <View style={styles.usesCard}>
          {USES.map((use, i) => (
            <View key={i}>
              <View style={styles.useRow}>
                <Text style={styles.useEmoji}>{use.emoji}</Text>
                <View style={styles.useInfo}>
                  <Text style={styles.useTitle}>{use.title}</Text>
                  <Text style={styles.useDesc}>{use.desc}</Text>
                </View>
                <View style={styles.useCost}>
                  <Text style={styles.useCostText}>{use.cost}</Text>
                </View>
              </View>
              {i < USES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  content: { padding: 20, paddingBottom: 40 },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  packageIcon: {
    width: 52, height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageEmoji: { fontSize: 26 },
  packageInfo: { flex: 1 },
  packageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  packageLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  popularBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularText: { fontSize: 11, color: Colors.white, fontWeight: 'bold' },
  packageDesc: { fontSize: 13, color: Colors.textLight },
  packagePrice: { alignItems: 'flex-end', gap: 4, minWidth: 60, alignItems: 'center' },
  priceText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  testCardText: { fontSize: 12, color: Colors.textLight, flex: 1 },
  usesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  useEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  useInfo: { flex: 1 },
  useTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  useDesc: { fontSize: 13, color: Colors.textLight },
  useCost: {
    backgroundColor: '#FFF0F3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  useCostText: { fontSize: 13, color: Colors.primary, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 62 },
});