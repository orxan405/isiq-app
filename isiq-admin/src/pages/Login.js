import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;

      if (!user.isAdmin) {
        setError('Admin icazəsi yoxdur');
        return;
      }

      localStorage.setItem('adminToken', accessToken);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={{ fontSize: 48 }}>💘</span>
          <h1 style={styles.title}>İşıq Admin</h1>
          <p style={styles.subtitle}>Admin panelinə daxil olun</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@isiq.app"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifrə</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Yüklənir...' : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    width: 380,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  logo: { textAlign: 'center', marginBottom: 32 },
  title: { margin: '8px 0 4px', fontSize: 24, color: '#1a1a2e' },
  subtitle: { color: '#888', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  error: {
    backgroundColor: '#fff0f0',
    border: '1px solid #ffcccc',
    borderRadius: 8,
    padding: 12,
    color: '#cc0000',
    fontSize: 14,
  },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  input: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #ddd',
    fontSize: 15,
    outline: 'none',
  },
  btn: {
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#FF4B6E',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 8,
  },
};