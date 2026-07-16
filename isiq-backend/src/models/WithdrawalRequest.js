const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coins: { type: Number, required: true },
  amount: { type: Number, required: true }, // USD
  bankCard: { type: String, required: true },
  cardHolder: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);