import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.log('Stats xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Yüklənir...</p>;

  return (
    <div>
      <h2 style={styles.title}>📊 Dashboard</h2>

      {/* Əsas statistika */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: '4px solid #6C63FF' }}>
          <div style={styles.cardTop}>
            <span style={styles.cardEmoji}>👥</span>
            <span style={{ ...styles.cardValue, color: '#6C63FF' }}>{stats?.users || 0}</span>
          </div>
          <p style={styles.cardLabel}>İstifadəçilər</p>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #FF4B6E' }}>
          <div style={styles.cardTop}>
            <span style={styles.cardEmoji}>❤️</span>
            <span style={{ ...styles.cardValue, color: '#FF4B6E' }}>{stats?.matches || 0}</span>
          </div>
          <p style={styles.cardLabel}>Matchlər</p>
        </div>

        <div style={{ ...styles.card, borderLeft: '4px solid #4CAF50' }}>
          <div style={styles.cardTop}>
            <span style={styles.cardEmoji}>💬</span>
            <span style={{ ...styles.cardValue, color: '#4CAF50' }}>{stats?.messages || 0}</span>
          </div>
          <p style={styles.cardLabel}>Mesajlar</p>
        </div>
      </div>

      {/* Çıxarışlar */}
      <h3 style={styles.subTitle}>💸 Çıxarışlar</h3>
      <div style={styles.withdrawalCard}>
        <div style={styles.withdrawalItem}>
          <div style={{ ...styles.withdrawalIcon, backgroundColor: '#FFF8E1' }}>
            <span style={styles.withdrawalEmoji}>⏳</span>
          </div>
          <p style={styles.withdrawalLabel}>Gözləyən</p>
          <p style={{ ...styles.withdrawalValue, color: '#FFA500' }}>
            {stats?.pendingWithdrawals || 0}
          </p>
        </div>

        <div style={styles.withdrawalDivider} />

        <div style={styles.withdrawalItem}>
          <div style={{ ...styles.withdrawalIcon, backgroundColor: '#E8F5E9' }}>
            <span style={styles.withdrawalEmoji}>✅</span>
          </div>
          <p style={styles.withdrawalLabel}>Təsdiqləndi</p>
          <p style={{ ...styles.withdrawalValue, color: '#4CAF50' }}>
            {stats?.approvedWithdrawals || 0}
          </p>
        </div>

        <div style={styles.withdrawalDivider} />

        <div style={styles.withdrawalItem}>
          <div style={{ ...styles.withdrawalIcon, backgroundColor: '#FFEBEE' }}>
            <span style={styles.withdrawalEmoji}>❌</span>
          </div>
          <p style={styles.withdrawalLabel}>Rədd edildi</p>
          <p style={{ ...styles.withdrawalValue, color: '#f44336' }}>
            {stats?.rejectedWithdrawals || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  title: { marginBottom: 24, color: '#1a1a2e' },
  subTitle: { margin: '24px 0 12px', color: '#1a1a2e' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: { fontSize: 32 },
  cardValue: { fontSize: 36, fontWeight: 'bold' },
  cardLabel: { color: '#888', fontSize: 14, margin: 0 },
  withdrawalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  withdrawalItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  withdrawalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawalEmoji: { fontSize: 28 },
  withdrawalLabel: { margin: 0, fontSize: 14, color: '#888' },
  withdrawalValue: { margin: 0, fontSize: 32, fontWeight: 'bold' },
  withdrawalDivider: {
    width: 1,
    height: 80,
    backgroundColor: '#f0f0f0',
    margin: '0 16px',
  },
};