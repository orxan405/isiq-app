const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// @GET /api/v1/messages/:matchId
exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match tapılmadı' });
    }

    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'İcazə yoxdur' });
    }

    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/messages/:matchId
exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Mesaj boş ola bilməz' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match tapılmadı' });
    }

    if (!match.users.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'İcazə yoxdur' });
    }

    // Alıcını tap
    const receiverId = match.users.find(
      (u) => u.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      matchId,
      senderId: req.user._id,
      receiverId,
      content: content.trim(),
    });

    // Match-in son mesajını yenilə
    await Match.findByIdAndUpdate(matchId, {
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
    });

    // Bildiriş yarat
    await Notification.create({
      userId: receiverId,
      type: 'message',
      fromUserId: req.user._id,
      matchId,
      title: `💬 ${req.user.name}`,
      body: content.trim().substring(0, 100),
    });

    // Push bildiriş göndər
    const receiver = await User.findById(receiverId);
    if (receiver?.pushToken) {
      try {
        await sendPushNotification(
          receiver.pushToken,
          `💬 ${req.user.name}`,
          content.trim().substring(0, 100),
          {
            type: 'message',
            matchId: matchId.toString(),
            userId: req.user._id.toString(),
          }
        );
      } catch (pushError) {
        console.log('Push xətası:', pushError.message);
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/v1/messages/:messageId
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Yalnız öz mesajınızı silə bilərsiniz' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({ success: true, message: 'Mesaj silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/v1/messages/unread/count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      type: 'message',
      isRead: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};