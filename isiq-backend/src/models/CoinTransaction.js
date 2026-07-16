const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['purchase', 'gift_sent', 'gift_received', 'superlike', 'withdrawal', 'admin', 'register'],
    required: true,
  },
  amount: { type: Number, required: true }, // müsbət = gəlir, mənfi = xərc
  description: { type: String },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);