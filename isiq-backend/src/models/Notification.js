const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'match', 'message', 'superlike'], required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);