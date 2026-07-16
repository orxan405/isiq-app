import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
  StatusBar, Image, ScrollView, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import api from '../../src/api/axios';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import Colors from '../../src/constants/colors';

const EMOJIS = [
  '😀','😂','🥰','😍','🤩','😘','😊','😎',
  '🥳','😁','😆','🤣','😅','😇','🤗','🤭',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
  '💕','💞','💓','💗','💖','💝','💘','💟',
  '👍','👏','🙌','🤝','🫶','🙏','💪','✌️',
  '🔥','⭐','✨','💫','🎉','🎊','🎈','🎁',
  '😭','😢','🥺','😔','😞','😟','😩','😫',
  '😡','🤬','😤','💀','🤡','👻','😈','🤯',
];

const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Qızılgül', cost: 10 },
  { id: 'chocolate', emoji: '🍫', name: 'Şokolad', cost: 15 },
  { id: 'gift', emoji: '🎁', name: 'Hədiyyə', cost: 20 },
  { id: 'bouquet', emoji: '💐', name: 'Buket', cost: 30 },
  { id: 'bear', emoji: '🧸', name: 'Oyuncaq', cost: 35 },
  { id: 'cake', emoji: '🍰', name: 'Tort', cost: 40 },
  { id: 'diamond', emoji: '💎', name: 'Brilyant', cost: 45 },
  { id: 'ring', emoji: '💍', name: 'Üzük', cost: 50 },
  { id: 'travel', emoji: '✈️', name: 'Səyahət', cost: 100 },
];

export default function Chat() {
  const { matchId } = useLocalSearchParams();
  const { user } = useAuth();
  const { sendMessage, onNewMessage, offNewMessage, emitTyping, emitStopTyping } = useSocket();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [coinBalance, setCoinBalance] = useState(0);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    AvoidSoftInput.setEnabled(true);
    AvoidSoftInput.setAvoidOffset(0);
    return () => {
      AvoidSoftInput.setEnabled(false);
    };
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchCoinBalance();

    onNewMessage((message) => {
      if (message.matchId === matchId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    return () => offNewMessage();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const [messagesRes, matchesRes] = await Promise.all([
        api.get(`/messages/${matchId}`),
        api.get('/matches'),
      ]);

      setMessages(messagesRes.data.messages);

      const match = matchesRes.data.matches.find((m) => m._id === matchId);
      if (match) {
        const other = match.users.find((u) => u._id !== user.id);
        setOtherUser(other);
      }
    } catch (error) {
      Alert.alert('Xəta', 'Mesajlar yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoinBalance = async () => {
    try {
      const response = await api.get('/payment/balance');
      setCoinBalance(response.data.coins || 0);
    } catch (error) {
      console.log('Coin balans xətası:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const content = input.trim();
    setInput('');
    setShowEmoji(false);

    const tempMsg = {
      _id: Date.now().toString(),
      matchId,
      senderId: user.id,
      content,
      createdAt: new Date(),
      temp: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const response = await api.post(`/messages/${matchId}`, { content });
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? response.data.message : m))
      );

      if (otherUser?._id) {
        sendMessage({
          matchId,
          senderId: user.id,
          receiverId: otherUser._id,
          content,
        });
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      Alert.alert('Xəta', 'Mesaj göndərilmədi');
    }
  };

  const handleSendGift = async (gift) => {
    if (coinBalance < gift.cost) {
      setShowGiftModal(false);
      Alert.alert(
        '🪙 Coin Lazımdır',
        `${gift.name} göndərmək üçün ${gift.cost} coin lazımdır.`,
        [
          { text: 'Xeyr', style: 'cancel' },
          { text: 'Coin Al', onPress: () => router.push('/coin-shop') },
        ]
      );
      return;
    }

    setShowGiftModal(false);

    const content = `🎁 ${gift.emoji} ${gift.name} göndərdi!`;

    const tempMsg = {
      _id: Date.now().toString(),
      matchId,
      senderId: user.id,
      content,
      createdAt: new Date(),
      isGift: true,
      giftEmoji: gift.emoji,
      temp: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const spendRes = await api.post('/payment/spend', {
        amount: gift.cost,
        reason: `gift_${gift.id}`,
        receiverId: otherUser?._id,
      });
      setCoinBalance(spendRes.data.coins);

      const response = await api.post(`/messages/${matchId}`, { content });
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id
          ? { ...response.data.message, isGift: true, giftEmoji: gift.emoji }
          : m))
      );

      if (otherUser?._id) {
        sendMessage({
          matchId,
          senderId: user.id,
          receiverId: otherUser._id,
          content,
        });
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      Alert.alert('Xəta', error.response?.data?.message || 'Hədiyyə göndərilmədi');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Mesajı sil',
      'Bu mesajı silmək istəyirsiniz?',
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/messages/${messageId}`);
              setMessages((prev) => prev.filter((m) => m._id !== messageId));
            } catch (error) {
              Alert.alert('Xəta', error.response?.data?.message || 'Silinmədi');
            }
          },
        },
      ]
    );
  };

  const handleUnmatch = () => {
    setShowMenu(false);
    Alert.alert(
      'Dostluqdan çıxart',
      `${otherUser?.name} ilə match-i silmək istəyirsiniz?`,
      [
        { text: 'Xeyr', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/matches/${matchId}`);
              router.replace('/(tabs)/matches');
            } catch (error) {
              Alert.alert('Xəta', 'Silinmədi');
            }
          },
        },
      ]
    );
  };

  const handleTyping = (text) => {
    setInput(text);

    if (otherUser) {
      emitTyping({ matchId, userId: user.id, receiverId: otherUser._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping({ matchId, userId: user.id, receiverId: otherUser._id });
      }, 1500);
    }
  };

  const toggleEmoji = () => {
    setShowEmoji((prev) => !prev);
    if (!showEmoji) {
      inputRef.current?.blur();
    } else {
      inputRef.current?.focus();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.senderId === user.id || item.senderId?._id === user.id;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== item.senderId);
    const isGift = item.isGift || item.content?.startsWith('🎁');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => {
          if (isMe) setSelectedMessage(item);
        }}
      >
        <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
          {!isMe && (
            <View style={styles.avatarSpace}>
              {showAvatar && (
                otherUser?.photos?.length > 0 ? (
                  <Image source={{ uri: otherUser.photos[0] }} style={styles.msgAvatar} />
                ) : (
                  <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.msgAvatarPlaceholder}>
                    <Text style={styles.msgAvatarText}>{otherUser?.name?.[0] || '?'}</Text>
                  </LinearGradient>
                )
              )}
            </View>
          )}

          <View style={styles.bubbleContainer}>
            {isGift ? (
              <View style={[styles.giftBubble, isMe ? styles.myGiftBubble : styles.theirGiftBubble]}>
                <Text style={styles.giftEmoji}>
                  {item.content?.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '🎁'}
                </Text>
                <Text style={[styles.giftText, isMe ? styles.myGiftText : styles.theirText]}>
                  {item.content}
                </Text>
              </View>
            ) : (
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                  {item.content}
                </Text>
              </View>
            )}
            <View style={[styles.timeRow, isMe ? styles.timeRight : styles.timeLeft]}>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
              {isMe && (
                <Ionicons
                  name={item.isRead ? 'checkmark-done' : 'checkmark'}
                  size={12}
                  color={item.isRead ? Colors.primary : Colors.textLight}
                />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF4B6E', '#FF8C5A']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => otherUser && router.push(`/user-profile/${otherUser._id}`)}
          activeOpacity={0.8}
        >
          {otherUser?.photos?.length > 0 ? (
            <Image source={{ uri: otherUser.photos[0] }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>{otherUser?.name?.[0] || '?'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{otherUser?.name || 'Söhbət'}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? 'yazır...' : 'aktiv'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => router.push({
              pathname: `/call/${matchId}`,
              params: {
                receiverId: otherUser?._id,
                receiverName: otherUser?.name,
                receiverPhoto: otherUser?.photos?.[0] || '',
                type: 'audio',
                isIncoming: 'false',
              },
            })}
          >
            <Ionicons name="call" size={20} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => router.push({
              pathname: `/call/${matchId}`,
              params: {
                receiverId: otherUser?._id,
                receiverName: otherUser?.name,
                receiverPhoto: otherUser?.photos?.[0] || '',
                type: 'video',
                isIncoming: 'false',
              },
            })}
          >
            <Ionicons name="videocam" size={20} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={{ flex: 1 }}>
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>👋</Text>
            <Text style={styles.emptyChatText}>
              {otherUser?.name} ilə söhbəti başlat!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id?.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
          />
        )}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingDots}>• • •</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        <TouchableOpacity onPress={toggleEmoji} style={styles.emojiBtn}>
          <Text style={styles.emojiBtnText}>{showEmoji ? '⌨️' : '😊'}</Text>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={Colors.textLight}
            value={input}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
            onFocus={() => setShowEmoji(false)}
          />
        </View>

        <TouchableOpacity
          style={styles.giftBtn}
          onPress={() => {
            setShowEmoji(false);
            setShowGiftModal(true);
          }}
        >
          <Text style={styles.giftBtnText}>🎁</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSend} disabled={!input.trim()}>
          <LinearGradient
            colors={input.trim() ? ['#FF4B6E', '#FF8C5A'] : [Colors.border, Colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showEmoji && (
        <View style={[styles.emojiPanel, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
          <ScrollView contentContainerStyle={styles.emojiGrid} showsVerticalScrollIndicator={false}>
            {EMOJIS.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiItem}
                onPress={() => setInput((prev) => prev + emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Hədiyyə Modal */}
      <Modal
        visible={showGiftModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftModal(false)}
      >
        <TouchableOpacity
          style={styles.giftModalOverlay}
          onPress={() => setShowGiftModal(false)}
          activeOpacity={1}
        >
          <View style={styles.giftModalCard}>
            <View style={styles.giftModalHeader}>
              <Text style={styles.giftModalTitle}>🎁 Hədiyyə Göndər</Text>
              <Text style={styles.giftModalBalance}>🪙 {coinBalance}</Text>
            </View>

            <View style={styles.giftsGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity
                  key={gift.id}
                  style={[styles.giftItem, coinBalance < gift.cost && styles.giftItemDisabled]}
                  onPress={() => handleSendGift(gift)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.giftItemEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftItemName}>{gift.name}</Text>
                  <View style={[styles.giftItemCost, coinBalance < gift.cost && styles.giftItemCostDisabled]}>
                    <Text style={[styles.giftItemCostText, coinBalance < gift.cost && styles.giftItemCostTextDisabled]}>
                      🪙 {gift.cost}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.buyCoinBtn}
              onPress={() => {
                setShowGiftModal(false);
                router.push('/coin-shop');
              }}
            >
              <Text style={styles.buyCoinBtnText}>🪙 Coin Al</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 3 nöqtə menyusu */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
          activeOpacity={1}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{otherUser?.name} ilə söhbət</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                otherUser && router.push(`/user-profile/${otherUser._id}`);
              }}
            >
              <Ionicons name="person-outline" size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Profili gör</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                Alert.alert(
                  'Bütün mesajları sil',
                  'Bu söhbətdəki bütün mesajlar silinəcək. Əminsiniz?',
                  [
                    { text: 'Xeyr', style: 'cancel' },
                    {
                      text: 'Sil',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await Promise.all(
                            messages
                              .filter((m) => m.senderId === user.id || m.senderId?._id === user.id)
                              .map((m) => api.delete(`/messages/${m._id}`))
                          );
                          setMessages((prev) =>
                            prev.filter((m) => m.senderId !== user.id && m.senderId?._id !== user.id)
                          );
                        } catch (error) {
                          Alert.alert('Xəta', 'Silinmədi');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, { color: '#ff4444' }]}>Mesajları sil</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleUnmatch}>
              <Ionicons name="heart-dislike-outline" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, { color: '#ff4444' }]}>Dostluqdan çıxart</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Uzun basma ilə mesaj sil */}
      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setSelectedMessage(null)}
          activeOpacity={1}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Mesaj seçimləri</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setSelectedMessage(null);
                handleDeleteMessage(selectedMessage._id);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
              <Text style={[styles.menuItemText, { color: '#ff4444' }]}>Mesajı sil</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  headerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
  headerName: { fontSize: 16, fontWeight: 'bold', color: Colors.white },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  moreBtn: { padding: 4 },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageWrapper: { marginBottom: 4, flexDirection: 'row', alignItems: 'flex-end' },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  avatarSpace: { width: 32, marginRight: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgAvatarPlaceholder: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { fontSize: 11, fontWeight: 'bold', color: Colors.white },
  bubbleContainer: { maxWidth: '75%' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  giftBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  myGiftBubble: { backgroundColor: '#FF4B6E20', borderWidth: 1.5, borderColor: Colors.primary },
  theirGiftBubble: { backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: Colors.primary },
  giftEmoji: { fontSize: 40 },
  giftText: { fontSize: 13, textAlign: 'center' },
  myGiftText: { color: Colors.primary },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: Colors.white },
  theirText: { color: Colors.text },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  timeRight: { justifyContent: 'flex-end' },
  timeLeft: { justifyContent: 'flex-start' },
  timeText: { fontSize: 10, color: Colors.textLight },
  typingContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  typingBubble: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  typingDots: { fontSize: 18, color: Colors.textLight, letterSpacing: 2 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyChatEmoji: { fontSize: 48 },
  emptyChatText: { fontSize: 15, color: Colors.textLight },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emojiBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  emojiBtnText: { fontSize: 24 },
  giftBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  giftBtnText: { fontSize: 24 },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: { fontSize: 15, color: Colors.text, maxHeight: 100 },
  sendButton: {
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPanel: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 250,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  emojiItem: { width: '12.5%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 28 },
  giftModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  giftModalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  giftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  giftModalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  giftModalBalance: { fontSize: 14, color: Colors.primary, fontWeight: 'bold' },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  giftItem: { width: '18%', alignItems: 'center', gap: 4 },
  giftItemDisabled: { opacity: 0.4 },
  giftItemEmoji: { fontSize: 36 },
  giftItemName: { fontSize: 10, color: Colors.text, textAlign: 'center' },
  giftItemCost: {
    backgroundColor: '#FFF0F3',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftItemCostDisabled: { backgroundColor: Colors.border },
  giftItemCostText: { fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
  giftItemCostTextDisabled: { color: Colors.textLight },
  buyCoinBtn: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buyCoinBtnText: { fontSize: 15, color: Colors.primary, fontWeight: 'bold' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  menuItemText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
});