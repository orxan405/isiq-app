import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import Colors from '../../src/constants/colors';

export default function Call() {
  const {
    matchId, receiverId, receiverName, receiverPhoto,
    type, isIncoming, callerId, callerName,
  } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [callStatus, setCallStatus] = useState(isIncoming === 'true' ? 'incoming' : 'calling');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('call:accepted', () => {
      setCallStatus('connected');
      startTimer();
    });

    socket.on('call:rejected', () => {
      Alert.alert('Zəng', 'Zəng rədd edildi');
      router.back();
    });

    socket.on('call:ended', () => {
      cleanup();
      router.back();
    });

    if (isIncoming !== 'true') {
      socket.emit('call:start', {
        matchId,
        callerId: user.id,
        receiverId,
        type: type || 'audio',
        callerName: user.name,
      });
    }

    return () => {
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
    };
  }, [socket]);

  const acceptCall = () => {
    setCallStatus('connected');
    startTimer();
    socket?.emit('call:accept', { matchId, callerId, receiverId: user.id });
  };

  const rejectCall = () => {
    socket?.emit('call:reject', { callerId, receiverId: user.id });
    router.back();
  };

  const endCall = () => {
    const target = isIncoming === 'true' ? callerId : receiverId;
    socket?.emit('call:end', { callerId: user.id, receiverId: target });
    cleanup();
    router.back();
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayName = isIncoming === 'true' ? callerName : receiverName;
  const displayPhoto = isIncoming === 'true' ? null : receiverPhoto;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.background}>
        <View style={styles.callerInfo}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayName?.[0] || '?'}</Text>
            </View>
          )}
          <Text style={styles.callerName}>{displayName}</Text>
          <Text style={styles.callType}>
            {type === 'video' ? '📹 Video zəng' : '🎤 Səs zəngi'}
          </Text>
          <Text style={styles.callStatus}>
            {callStatus === 'incoming' && '📞 Zəng gəlir...'}
            {callStatus === 'calling' && '📞 Zəng edilir...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
          </Text>
        </View>

        <View style={styles.controls}>
          {callStatus === 'incoming' ? (
            <View style={styles.incomingControls}>
              <View style={styles.incomingBtn}>
                <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
                  <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
                <Text style={styles.btnLabel}>Rədd et</Text>
              </View>
              <View style={styles.incomingBtn}>
                <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
                  <Ionicons name="call" size={32} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.btnLabel}>Qəbul et</Text>
              </View>
            </View>
          ) : (
            <View style={styles.activeControls}>
              <View style={styles.controlItem}>
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={toggleMute}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={24}
                    color={Colors.white}
                  />
                </TouchableOpacity>
                <Text style={styles.controlLabel}>{isMuted ? 'Səssiz' : 'Mikrofon'}</Text>
              </View>

              <View style={styles.controlItem}>
                <TouchableOpacity style={styles.endBtn} onPress={endCall}>
                  <Ionicons name="call" size={32} color={Colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
                <Text style={styles.controlLabel}>Bitir</Text>
              </View>

              <View style={styles.controlItem}>
                <TouchableOpacity style={styles.controlBtn}>
                  <Ionicons name="volume-high" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.controlLabel}>Dinamik</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 60 },
  callerInfo: { alignItems: 'center', gap: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: Colors.white },
  callerName: { fontSize: 28, fontWeight: 'bold', color: Colors.white },
  callType: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  callStatus: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  controls: { paddingHorizontal: 40 },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  incomingBtn: { alignItems: 'center', gap: 12 },
  rejectBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f44336',
    justifyContent: 'center', alignItems: 'center',
  },
  acceptBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  btnLabel: { fontSize: 14, color: Colors.white },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlItem: { alignItems: 'center', gap: 8 },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,0,0,0.4)' },
  controlLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  endBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f44336',
    justifyContent: 'center', alignItems: 'center',
  },
});