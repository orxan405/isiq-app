const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// @GET /api/v1/messages/:matchId
const getMessages = async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match tapılmadı' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ matchId: req.params.matchId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    await Message.updateMany(
      { matchId: req.params.matchId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, count: messages.length, page, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/messages/:matchId
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Mesaj boş ola bilməz' });
    }

    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match tapılmadı' });
    }

    const receiverId = match.users.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      matchId: req.params.matchId,
      senderId: req.user._id,
      receiverId,
      content: content.trim(),
    });

    match.lastMessage = content.trim();
    match.lastMessageAt = new Date();
    match.lastMessageBy = req.user._id;
    await match.save();

    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('newMessage', message);
    io.to(req.user._id.toString()).emit('messageSent', message);

    // Bildiriş yarat
    await Notification.create({
      userId: receiverId,
      type: 'message',
      fromUserId: req.user._id,
      matchId: req.params.matchId,
      title: '💬 Yeni Mesaj',
      body: `${req.user.name}: ${content.trim()}`,
    });

    // Push bildiriş göndər
    const receiver = await User.findById(receiverId);
    if (receiver?.pushToken) {
      try {
        await sendPushNotification(
          receiver.pushToken,
          '💬 Yeni Mesaj',
          `${req.user.name}: ${content.trim()}`,
          { type: 'message', matchId: req.params.matchId }
        );
      } catch (pushError) {
        console.log('Push bildiriş xətası:', pushError.message);
      }
    }

    res.status(201).json({
      success: true,
      message,
      coinInfo: {
        free: true,
        freeMessagesLeft: 999,
        coins: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/v1/messages/unread/count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/v1/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      senderId: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }

    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - message.createdAt > tenMinutes) {
      return res.status(400).json({ success: false, message: '10 dəqiqə keçib, silinə bilməz' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Mesaj silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, sendMessage, getUnreadCount, deleteMessage };