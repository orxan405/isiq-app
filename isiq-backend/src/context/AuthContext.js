import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('loadUser xətası:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
  try {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;

    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Server ilə əlaqə yoxdur',
    };
  }
};

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.log('Login xətası:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Email və ya şifrə yanlışdır',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('logout xətası:', error);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      setUser(null);
    }
  };

  const updateUser = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);