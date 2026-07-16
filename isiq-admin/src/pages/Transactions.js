import { useState, useEffect } from 'react';
import api from '../api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/transactions?page=${page}&limit=20`);
      setTransactions(response.data.transactions);
      setTotal(response.data.total);
    } catch (error) {
      console.log('Transaction xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'purchase': return '💳';
      case 'gift_sent': return '🎁';
      case 'gift_received': return '🎀';
      case 'superlike': return '⭐';
      case 'withdrawal': return '💸';
      case 'admin': return '👨‍💼';
      case 'register': return '🎉';
      default: return '🪙';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'purchase': return 'Alış';
      case 'gift_sent': return 'Hədiyyə göndərildi';
      case 'gift_received': return 'Hədiyyə alındı';
      case 'superlike': return 'Super Like';
      case 'withdrawal': return 'Çıxarış';
      case 'admin': return 'Admin';
      case 'register': return 'Qeydiyyat';
      default: return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'purchase': return '#4CAF50';
      case 'gift_sent': return '#FF4B6E';
      case 'gift_received': return '#4CAF50';
      case 'superlike': return '#FFC107';
      case 'withdrawal': return '#f44336';
      case 'admin': return '#6C63FF';
      case 'register': return '#4CAF50';
      default: return '#888';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('az-AZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / 20);

  const filtered = search
    ? transactions.filter((t) =>
        t.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.userId?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>🪙 Coin Əməliyyatları ({total})</h2>
        <input
          type="text"
          placeholder="Ad və ya email axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
      </div>

      {loading ? (
        <p>Yüklənir...</p>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>Əməliyyat yoxdur</div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Növ</th>
                  <th style={styles.th}>İstifadəçi</th>
                  <th style={styles.th}>Əlaqəli</th>
                  <th style={styles.th}>Məbləğ</th>
                  <th style={styles.th}>Açıqlama</th>
                  <th style={styles.th}>Tarix</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: getTypeColor(t.type) + '20',
                        color: getTypeColor(t.type),
                      }}>
                        {getTypeIcon(t.type)} {getTypeText(t.type)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <p style={styles.userName}>{t.userId?.name || '—'}</p>
                        <p style={styles.userEmail}>{t.userId?.email || '—'}</p>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {t.relatedUserId ? (
                        <div>
                          <p style={styles.userName}>{t.relatedUserId?.name}</p>
                          <p style={styles.userEmail}>{t.relatedUserId?.email}</p>
                        </div>
                      ) : (
                        <span style={{ color: '#ccc' }}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        fontWeight: 'bold',
                        fontSize: 16,
                        color: t.amount > 0 ? '#4CAF50' : '#f44336',
                      }}>
                        {t.amount > 0 ? '+' : ''}{t.amount} 🪙
                      </span>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.desc}>{t.description || '—'}</p>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.date}>{formatDate(t.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Əvvəlki
              </button>
              <span style={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.5 : 1 }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Növbəti →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, color: '#1a1a2e' },
  search: {
    padding: '10px 16px', borderRadius: 10, border: '1px solid #ddd',
    fontSize: 14, width: 280, outline: 'none',
  },
  empty: {
    backgroundColor: 'white', borderRadius: 16, padding: 40,
    textAlign: 'center', color: '#888',
  },
  tableWrapper: {
    backgroundColor: 'white', borderRadius: 16,
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: 13, color: '#666', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: 14, color: '#333' },
  typeBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  userName: { margin: 0, fontWeight: '600', fontSize: 13 },
  userEmail: { margin: 0, fontSize: 12, color: '#888' },
  desc: { margin: 0, fontSize: 13, color: '#555', maxWidth: 200 },
  date: { margin: 0, fontSize: 12, color: '#888' },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 16, marginTop: 20,
  },
  pageBtn: {
    padding: '8px 16px', borderRadius: 10, border: '1px solid #ddd',
    backgroundColor: 'white', cursor: 'pointer', fontSize: 13,
  },
  pageInfo: { fontSize: 14, color: '#666' },
};