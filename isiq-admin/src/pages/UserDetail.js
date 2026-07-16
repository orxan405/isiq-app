import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}/details`);
      setData(response.data);
    } catch (error) {
      console.log('User detail xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm('İstifadəçini bloklamaq istəyirsiniz?')) return;
    try {
      await api.put(`/admin/users/${id}/block`);
      fetchUserDetail();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const handleUnblock = async () => {
    try {
      await api.put(`/admin/users/${id}/unblock`);
      fetchUserDetail();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const handleAddCoins = async () => {
    const coins = window.prompt('Neçə coin əlavə etmək istəyirsiniz?');
    if (!coins) return;
    try {
      await api.put(`/admin/users/${id}/coins`, { coins: parseInt(coins) });
      alert('✅ Coin əlavə edildi!');
      fetchUserDetail();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('İstifadəçini silmək istəyirsiniz? Bu əməliyyat geri alına bilməz!')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      navigate('/users');
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('az-AZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#e8f5e9', color: '#4CAF50' };
      case 'rejected': return { bg: '#ffebee', color: '#f44336' };
      default: return { bg: '#FFF8E1', color: '#FFA500' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '✅ Təsdiqləndi';
      case 'rejected': return '❌ Rədd edildi';
      default: return '⏳ Gözləyir';
    }
  };

  if (loading) return <p>Yüklənir...</p>;
  if (!data) return <p>İstifadəçi tapılmadı</p>;

  const { user, stats, withdrawalHistory } = data;

  return (
    <div>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/users')}>
          ← Geri
        </button>
        <h2 style={styles.title}>👤 {user.name}</h2>
        <div style={styles.actions}>
          <button
            style={{ ...styles.actionBtn, backgroundColor: user.isActive ? '#ff9800' : '#4CAF50' }}
            onClick={user.isActive ? handleBlock : handleUnblock}
          >
            {user.isActive ? '🚫 Blokla' : '✅ Blokdan çıxar'}
          </button>
          <button
            style={{ ...styles.actionBtn, backgroundColor: '#6C63FF' }}
            onClick={handleAddCoins}
          >
            🪙 Coin əlavə et
          </button>
          <button
            style={{ ...styles.actionBtn, backgroundColor: '#f44336' }}
            onClick={handleDelete}
          >
            🗑️ Sil
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Profil məlumatları */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Profil Məlumatları</h3>

          {user.photos?.length > 0 && (
            <div style={styles.photosRow}>
              {user.photos.map((photo, i) => (
                <a key={i} href={photo} target="_blank" rel="noreferrer">
                  <div style={styles.photoWrapper}>
                    <img
                      src={photo}
                      alt=""
                      style={styles.photo}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{ ...styles.photoPlaceholder, display: 'none' }}>
                      {user.name?.[0]}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>📧 Email:</span>
              <span style={styles.infoValue}>{user.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>🎂 Yaş:</span>
              <span style={styles.infoValue}>{user.age}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>👤 Cins:</span>
              <span style={styles.infoValue}>{user.gender}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>📍 Şəhər:</span>
              <span style={styles.infoValue}>{user.city}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>📅 Qeydiyyat:</span>
              <span style={styles.infoValue}>{formatDate(user.createdAt)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>👁️ Son görünüş:</span>
              <span style={styles.infoValue}>{formatDate(user.lastSeen)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>✅ Status:</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: user.isActive ? '#e8f5e9' : '#ffebee',
                color: user.isActive ? '#4CAF50' : '#f44336',
              }}>
                {user.isActive ? 'Aktiv' : 'Blok'}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>🪙 Coin:</span>
              <span style={{ ...styles.infoValue, color: '#FF4B6E', fontWeight: 'bold' }}>
                {user.coins}
              </span>
            </div>
            {user.bio && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>📝 Bio:</span>
                <span style={styles.infoValue}>{user.bio}</span>
              </div>
            )}
            {user.job && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>💼 İş:</span>
                <span style={styles.infoValue}>{user.job}</span>
              </div>
            )}
            {user.education && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>🎓 Təhsil:</span>
                <span style={styles.infoValue}>{user.education}</span>
              </div>
            )}
            {user.height && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>📏 Boy:</span>
                <span style={styles.infoValue}>{user.height} sm</span>
              </div>
            )}
            {user.weight && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>⚖️ Çəki:</span>
                <span style={styles.infoValue}>{user.weight} kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistika */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Statistika</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statEmoji}>❤️</span>
              <span style={styles.statValue}>{stats.matches}</span>
              <span style={styles.statLabel}>Match</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statEmoji}>💬</span>
              <span style={styles.statValue}>{stats.messages}</span>
              <span style={styles.statLabel}>Mesaj</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statEmoji}>💸</span>
              <span style={styles.statValue}>{stats.withdrawals}</span>
              <span style={styles.statLabel}>Çıxarış</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statEmoji}>🔔</span>
              <span style={styles.statValue}>{stats.notifications}</span>
              <span style={styles.statLabel}>Bildiriş</span>
            </div>
          </div>
        </div>
      </div>

      {/* Çıxarış tarixçəsi */}
      {withdrawalHistory?.length > 0 && (
        <div style={{ ...styles.card, marginTop: 20 }}>
          <h3 style={styles.cardTitle}>💸 Çıxarış Tarixçəsi</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Coin</th>
                <th style={styles.th}>Məbləğ</th>
                <th style={styles.th}>Kart</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Tarix</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalHistory.map((w) => {
                const statusStyle = getStatusColor(w.status);
                return (
                  <tr key={w._id} style={styles.tr}>
                    <td style={styles.td}>🪙 {w.coins}</td>
                    <td style={styles.td}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>${w.amount}</span>
                    </td>
                    <td style={styles.td}>{w.bankCard}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {getStatusText(w.status)}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(w.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: {
    padding: '8px 16px', borderRadius: 10, border: '1px solid #ddd',
    backgroundColor: 'white', cursor: 'pointer', fontSize: 13,
  },
  title: { margin: 0, color: '#1a1a2e', flex: 1 },
  actions: { display: 'flex', gap: 8 },
  actionBtn: {
    padding: '8px 16px', borderRadius: 10, border: 'none',
    color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: { margin: '0 0 16px', color: '#1a1a2e', fontSize: 16 },
  photosRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  photoWrapper: {
    position: 'relative', width: 80, height: 80,
    borderRadius: 10, overflow: 'hidden',
  },
  photo: {
    width: 80, height: 80, borderRadius: 10,
    objectFit: 'cover', display: 'block',
  },
  photoPlaceholder: {
    position: 'absolute', top: 0, left: 0,
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#FF4B6E', color: 'white',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 'bold',
  },
  infoList: { display: 'flex', flexDirection: 'column', gap: 10 },
  infoRow: { display: 'flex', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: '#888', minWidth: 120 },
  infoValue: { fontSize: 13, color: '#333' },
  statusBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  statItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 12,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#888' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#666', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333' },
};