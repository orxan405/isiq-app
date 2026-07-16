import { useState, useEffect } from 'react';
import api from '../api';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/withdrawals?status=${filter}`);
      setWithdrawals(response.data.withdrawals);
    } catch (error) {
      console.log('Withdrawals xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Bu çıxarışı təsdiqləmək istəyirsiniz?')) return;
    try {
      await api.put(`/admin/withdrawals/${id}/approve`);
      alert('✅ Təsdiqləndi!');
      fetchWithdrawals();
    } catch (error) {
      console.log('Approve xətası:', error);
      alert('Xəta: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id) => {
    const note = window.prompt('Rədd etmə səbəbi (ixtiyari):');
    if (note === null) return;
    try {
      await api.put(`/admin/withdrawals/${id}/reject`, { note });
      alert('❌ Rədd edildi, coin geri qaytarıldı');
      fetchWithdrawals();
    } catch (error) {
      console.log('Reject xətası:', error);
      alert('Xəta: ' + (error.response?.data?.message || error.message));
    }
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('az-AZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>💸 Çıxarış Sorğuları</h2>
        <div style={styles.filters}>
          {['pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              style={{ ...styles.filterBtn, ...(filter === s ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(s)}
            >
              {s === 'pending' ? '⏳ Gözləyir' : s === 'approved' ? '✅ Təsdiqləndi' : '❌ Rədd edildi'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Yüklənir...</p>
      ) : withdrawals.length === 0 ? (
        <div style={styles.empty}>
          <p>Heç bir sorğu yoxdur</p>
        </div>
      ) : (
        <div style={styles.list}>
          {withdrawals.map((w) => {
            const statusStyle = getStatusColor(w.status);
            return (
              <div key={w._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>{w.userId?.name?.[0] || '?'}</div>
                    <div>
                      <p style={styles.userName}>{w.userId?.name}</p>
                      <p style={styles.userEmail}>{w.userId?.email}</p>
                    </div>
                  </div>
                  <span style={{ ...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                    {getStatusText(w.status)}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>🪙 Coin:</span>
                    <span style={styles.infoValue}>{w.coins} coin</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>💵 Məbləğ:</span>
                    <span style={{ ...styles.infoValue, color: '#4CAF50', fontWeight: 'bold' }}>${w.amount}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>💳 Kart:</span>
                    <span style={styles.infoValue}>{w.bankCard}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>👤 Sahibi:</span>
                    <span style={styles.infoValue}>{w.cardHolder}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>📅 Tarix:</span>
                    <span style={styles.infoValue}>{formatDate(w.createdAt)}</span>
                  </div>
                  {w.note ? (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>📝 Qeyd:</span>
                      <span style={styles.infoValue}>{w.note}</span>
                    </div>
                  ) : null}
                </div>

                {w.status === 'pending' && (
                  <div style={styles.cardActions}>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#4CAF50' }}
                      onClick={() => handleApprove(w._id)}
                    >
                      ✅ Təsdiqlə
                    </button>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#f44336' }}
                      onClick={() => handleReject(w._id)}
                    >
                      ❌ Rədd et
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, color: '#1a1a2e' },
  filters: { display: 'flex', gap: 8 },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: 13,
  },
  filterBtnActive: {
    backgroundColor: '#FF4B6E',
    color: 'white',
    border: '1px solid #FF4B6E',
  },
  empty: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    textAlign: 'center',
    color: '#888',
  },
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    backgroundColor: '#FF4B6E', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: 18,
  },
  userName: { margin: 0, fontWeight: 'bold', color: '#333' },
  userEmail: { margin: 0, fontSize: 12, color: '#888' },
  statusBadge: { padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600 },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  infoRow: { display: 'flex', gap: 8, alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#888', minWidth: 80 },
  infoValue: { fontSize: 13, color: '#333' },
  cardActions: { display: 'flex', gap: 8 },
  actionBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: 10,
    border: 'none',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};