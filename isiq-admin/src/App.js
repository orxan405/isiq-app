import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Withdrawals from './pages/Withdrawals';
import Notifications from './pages/Notifications';
import UserDetail from './pages/UserDetail';
import Layout from './components/Layout';
import Transactions from './pages/Transactions';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;