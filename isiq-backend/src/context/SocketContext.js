import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// const SOCKET_URL = 'http://172.18.128.1:5000'; // ← öz IP-ni yaz
const SOCKET_URL = 'https://isiq-backend.onrender.com';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [user]);

  const connectSocket = async () => {
    const token = await AsyncStorage.getItem('accessToken');

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join', { userId: user.id });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const sendMessage = ({ matchId, senderId, receiverId, content }) => {
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { matchId, senderId, receiverId, content });
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('newMessage', callback);
    }
  };

  const offNewMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('newMessage');
    }
  };

  const emitTyping = ({ matchId, userId, receiverId }) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { matchId, userId, receiverId });
    }
  };

  const emitStopTyping = ({ matchId, userId, receiverId }) => {
    if (socketRef.current) {
      socketRef.current.emit('stopTyping', { matchId, userId, receiverId });
    }
  };

  const onNewMatch = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('newMatch', callback);
    }
  };

  const offNewMatch = () => {
    if (socketRef.current) {
      socketRef.current.off('newMatch');
    }
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      sendMessage,
      onNewMessage,
      offNewMessage,
      emitTyping,
      emitStopTyping,
      onNewMatch,
      offNewMatch,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);