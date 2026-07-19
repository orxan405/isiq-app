const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const matchRoutes = require('./src/routes/matches');
const messageRoutes = require('./src/routes/messages');
const uploadRoutes = require('./src/routes/upload');
const paymentRoutes = require('./src/routes/payment');
const notificationRoutes = require('./src/routes/notifications');
const withdrawalRoutes = require('./src/routes/withdrawal');
const adminRoutes = require('./src/routes/admin');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const keepAlive = require('./src/utils/keepAlive');
const User = require('./src/models/User');
const { sendPushNotification } = require('./src/utils/pushNotification');

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'İşıq API işləyir' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/withdrawal', withdrawalRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('İstifadəçi bağlandı:', socket.id);

  socket.on('join', ({ userId }) => {
    socket.join(userId);
    console.log(`${userId} öz otağına qoşuldu`);
  });

  socket.on('sendMessage', async ({ matchId, senderId, receiverId, content }) => {
    const message = {
      matchId,
      senderId,
      receiverId,
      content,
      createdAt: new Date(),
    };
    io.to(receiverId).emit('newMessage', message);
    io.to(senderId).emit('messageSent', message);
  });

  socket.on('typing', ({ matchId, userId, receiverId }) => {
    io.to(receiverId).emit('userTyping', { matchId, userId });
  });

  socket.on('stopTyping', ({ matchId, userId, receiverId }) => {
    io.to(receiverId).emit('userStopTyping', { matchId, userId });
  });

  // WebRTC Signaling
  socket.on('call:start', async ({ matchId, callerId, receiverId, type, callerName }) => {
    console.log(`Zəng başladı: ${callerId} → ${receiverId} (${type})`);

    // Socket ilə bildiriş
    io.to(receiverId).emit('call:incoming', {
      matchId, callerId, type, callerName,
    });

    // Push bildiriş göndər
    try {
      const receiver = await User.findById(receiverId);
      if (receiver?.pushToken) {
        await sendPushNotification(
          receiver.pushToken,
          `📞 ${callerName} zəng edir`,
          `${type === 'video' ? '📹 Video' : '🎤 Səs'} zəngi`,
          { type: 'call', matchId, callerId, callerName, callType: type }
        );
      }
    } catch (error) {
      console.log('Push zəng xətası:', error.message);
    }
  });

  socket.on('call:accept', ({ matchId, callerId, receiverId }) => {
    console.log(`Zəng qəbul edildi: ${receiverId} → ${callerId}`);
    io.to(callerId).emit('call:accepted', { matchId, receiverId });
  });

  socket.on('call:reject', ({ callerId, receiverId }) => {
    console.log(`Zəng rədd edildi: ${receiverId} → ${callerId}`);
    io.to(callerId).emit('call:rejected', { receiverId });
  });

  socket.on('call:end', ({ callerId, receiverId }) => {
    console.log(`Zəng bitdi: ${callerId} ↔ ${receiverId}`);
    io.to(receiverId).emit('call:ended', { callerId });
    io.to(callerId).emit('call:ended', { callerId });
  });

  socket.on('call:offer', ({ offer, receiverId }) => {
    io.to(receiverId).emit('call:offer', { offer });
  });

  socket.on('call:answer', ({ answer, callerId }) => {
    io.to(callerId).emit('call:answer', { answer });
  });

  socket.on('call:ice', ({ candidate, receiverId }) => {
    io.to(receiverId).emit('call:ice', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('İstifadəçi ayrıldı:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
  keepAlive();
});