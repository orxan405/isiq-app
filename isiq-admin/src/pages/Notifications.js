import { useState, useEffect } from 'react';
import api from '../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/notifications?page=${page}&limit=20`);
      setNotifications(response.data.notifications);
      setTotal(response.data.total);
    } catch (error) {
      console.log('Bildiriş xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'match': return '🎉';
      case 'message': return '💬';
      case 'superlike': return '⭐';
      default: return '🔔';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'like': return 'Bəyənmə';
      case 'match': return 'Match';
      case 'message': return 'Mesaj';
      case 'superlike': return 'Super Like';
      default: return 'Bildiriş';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'like': return '#FF4B6E';
      case 'match': return '#FF8C5A';
      case 'message': return '#6C63FF';
      case 'superlike': return '#FFC107';
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>🔔 Bildirişlər ({total})</h2>
      </div>

      {loading ? (
        <p>Yüklənir...</p>
      ) : notifications.length === 0 ? (
        <div style={styles.empty}>Bildiriş yoxdur</div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Növ</th>
                  <th style={styles.th}>Alan</th>
                  <th style={styles.th}>Göndərən</th>
                  <th style={styles.th}>Məzmun</th>
                  <th style={styles.th}>Oxunub</th>
                  <th style={styles.th}>Tarix</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: getTypeColor(n.type) + '20',
                        color: getTypeColor(n.type),
                      }}>
                        {getTypeIcon(n.type)} {getTypeText(n.type)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <p style={styles.userName}>{n.userId?.name || '—'}</p>
                        <p style={styles.userEmail}>{n.userId?.email || '—'}</p>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <p style={styles.userName}>{n.fromUserId?.name || '—'}</p>
                        <p style={styles.userEmail}>{n.fromUserId?.email || '—'}</p>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.notifBody}>{n.body}</p>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.readBadge,
                        backgroundColor: n.isRead ? '#e8f5e9' : '#ffebee',
                        color: n.isRead ? '#4CAF50' : '#f44336',
                      }}>
                        {n.isRead ? '✅ Oxundu' : '🔴 Oxunmadı'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.date}>{formatDate(n.createdAt)}</p>
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
  typeBadge: {
    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
  },
  userName: { margin: 0, fontWeight: '600', fontSize: 13 },
  userEmail: { margin: 0, fontSize: 12, color: '#888' },
  notifBody: { margin: 0, fontSize: 13, color: '#555', maxWidth: 200 },
  readBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
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