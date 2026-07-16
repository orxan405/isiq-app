import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?search=${search}`);
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.log('Users xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id, isActive) => {
    try {
      const endpoint = isActive ? `/admin/users/${id}/block` : `/admin/users/${id}/unblock`;
      await api.put(endpoint);
      fetchUsers();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('İstifadəçini silmək istəyirsiniz?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const handleAddCoins = async (id) => {
    const coins = window.prompt('Neçə coin əlavə etmək istəyirsiniz?');
    if (!coins) return;
    try {
      await api.put(`/admin/users/${id}/coins`, { coins: parseInt(coins) });
      alert('✅ Coin əlavə edildi!');
      fetchUsers();
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>👥 İstifadəçilər ({total})</h2>
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
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Ad</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Yaş / Cins</th>
                <th style={styles.th}>Şəhər</th>
                <th style={styles.th}>Coin</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div
                      style={{ ...styles.userInfo, cursor: 'pointer' }}
                      onClick={() => navigate(`/users/${user._id}`)}
                    >
                      <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                        {user.photos?.[0] ? (
                          <>
                            <img
                              src={user.photos[0]}
                              alt=""
                              style={styles.avatar}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{ ...styles.avatarPlaceholder, display: 'none' }}>
                              {user.name[0]}
                            </div>
                          </>
                        ) : (
                          <div style={styles.avatarPlaceholder}>
                            {user.name[0]}
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#FF4B6E', textDecoration: 'underline' }}>
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.age} / {user.gender}</td>
                  <td style={styles.td}>{user.city}</td>
                  <td style={styles.td}>
                    <span style={styles.coinBadge}>🪙 {user.coins}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: user.isActive ? '#e8f5e9' : '#ffebee',
                      color: user.isActive ? '#4CAF50' : '#f44336',
                    }}>
                      {user.isActive ? '✅ Aktiv' : '🚫 Blok'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{ ...styles.btn, backgroundColor: user.isActive ? '#ff9800' : '#4CAF50' }}
                        onClick={() => handleBlock(user._id, user.isActive)}
                      >
                        {user.isActive ? 'Blokla' : 'Aç'}
                      </button>
                      <button
                        style={{ ...styles.btn, backgroundColor: '#6C63FF' }}
                        onClick={() => handleAddCoins(user._id)}
                      >
                        🪙 Coin
                      </button>
                      <button
                        style={{ ...styles.btn, backgroundColor: '#f44336' }}
                        onClick={() => handleDelete(user._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  tableWrapper: {
    backgroundColor: 'white', borderRadius: 16,
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: 13, color: '#666', fontWeight: 600 },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: 14, color: '#333' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    objectFit: 'cover', display: 'block',
  },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: '50%',
    backgroundColor: '#FF4B6E', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 'bold', fontSize: 14, position: 'absolute', top: 0, left: 0,
  },
  coinBadge: { backgroundColor: '#FFF8E1', padding: '4px 8px', borderRadius: 8, fontSize: 13 },
  statusBadge: { padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  actions: { display: 'flex', gap: 6 },
  btn: {
    padding: '6px 12px', borderRadius: 8, border: 'none',
    color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600,
  },
};