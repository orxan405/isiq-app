const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  isActive: { type: Boolean, default: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date },
  lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Match', matchSchema);