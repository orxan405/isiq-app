import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import Colors from '../src/constants/colors';

const PLANS = [
  {
    id: 'gold',
    name: 'Gold',
    emoji: '⭐',
    price: '9.99',
    color: ['#FFD700', '#FFA500'],
    features: [
      'Limitsiz bəyənmə',
      'Kim sizi bəyəndi görmək',
      'Gündə 5 Super Like',
      'Reklamsız istifadə',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    emoji: '💎',
    price: '19.99',
    color: ['#E5E4E2', '#A9A9A9'],
    features: [
      'Gold-un bütün xüsusiyyətləri',
      'Limitsiz Super Like',
      'Profil önə çıxarma',
      'Hədiyyə göndərmə',
      'Oxundu bildirişi',
    ],
  },
];

export default function Premium() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('gold');

  const handleBuy = () => {
    Alert.alert(
      '💳 Ödəniş',
      `${PLANS.find(p => p.id === selectedPlan)?.name} planı seçdiniz. Ödənişə davam etmək istəyirsiniz?`,
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Bəli',
          onPress: () => Alert.alert('🚧', 'Tezliklə aktivləşəcək!'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ Premium</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Daha çox imkan, daha çox match!</Text>

        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={plan.color} style={styles.planHeader}>
              <Text style={styles.planEmoji}>{plan.emoji}</Text>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>${plan.price}/ay</Text>
            </LinearGradient>

            <View style={styles.planFeatures}>
              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {selectedPlan === plan.id && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark" size={16} color={Colors.white} />
                <Text style={styles.selectedBadgeText}>Seçildi</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
          <LinearGradient
            colors={['#FF4B6E', '#FF8C5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyBtnGradient}
          >
            <Text style={styles.buyBtnText}>
              {PLANS.find(p => p.id === selectedPlan)?.name} Al — ${PLANS.find(p => p.id === selectedPlan)?.price}/ay
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Abunəlik avtomatik yenilənir. İstənilən vaxt ləğv edə bilərsiniz.
        </Text>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  planHeader: {
    padding: 20,
    alignItems: 'center',
  },
  planEmoji: { fontSize: 40, marginBottom: 8 },
  planName: { fontSize: 22, fontWeight: 'bold', color: Colors.white, marginBottom: 4 },
  planPrice: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  planFeatures: { padding: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: Colors.text },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: { color: Colors.white, fontSize: 13, fontWeight: 'bold' },
  buyBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 16 },
  buyBtnGradient: { padding: 18, alignItems: 'center', borderRadius: 16 },
  buyBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  terms: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },
});