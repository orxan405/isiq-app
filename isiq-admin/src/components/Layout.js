import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

//   const menuItems = [
//     { path: '/', label: '📊 Dashboard', icon: '📊' },
//     { path: '/users', label: '👥 İstifadəçilər', icon: '👥' },
//     { path: '/withdrawals', label: '💸 Çıxarışlar', icon: '💸' },
//   ];


    const menuItems = [
            { path: '/', label: '📊 Dashboard' },
            { path: '/users', label: '👥 İstifadəçilər' },
            { path: '/withdrawals', label: '💸 Çıxarışlar' },
            { path: '/notifications', label: '🔔 Bildirişlər' },
            { path: '/transactions', label: '🪙 Coin Əməliyyatları' },
            ];


  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>💘</span>
          <span style={styles.logoText}>İşıq Admin</span>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Çıxış
        </button>
      </div>

      <div style={styles.main}>
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' },
  sidebar: {
    width: 240,
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 20px 20px',
    borderBottom: '1px solid #333',
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 28 },
  logoText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 10px' },
  navItem: {
    padding: '12px 16px',
    borderRadius: 10,
    color: '#aaa',
    textDecoration: 'none',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#FF4B6E',
    color: 'white',
  },
  logoutBtn: {
    margin: '0 10px',
    padding: '12px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#333',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
  },
  main: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'auto', padding: 24 },
};