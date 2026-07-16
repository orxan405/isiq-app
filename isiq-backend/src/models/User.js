const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad tələb olunur'],
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email tələb olunur'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Şifrə tələb olunur'],
    minlength: 6,
    select: false,
  },
  age: {
    type: Number,
    required: [true, 'Yaş tələb olunur'],
    min: 18,
    max: 80,
  },
  gender: {
    type: String,
    required: [true, 'Cins tələb olunur'],
    enum: ['kişi', 'qadın', 'digər'],
  },
  interestedIn: [{
    type: String,
    enum: ['kişi', 'qadın', 'digər'],
  }],
  city: {
    type: String,
    required: [true, 'Şəhər tələb olunur'],
    trim: true,
  },
  location: {
    latitude: { type: mongoose.Schema.Types.Decimal128 },
    longitude: { type: mongoose.Schema.Types.Decimal128 },
  },
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  photos: {
    type: [String],
    default: [],
    validate: {
      validator: (v) => v.length <= 6,
      message: 'Maksimum 6 şəkil yükləyə bilərsiniz',
    },
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: (v) => v.length <= 16,
      message: 'Maksimum 16 maraq seçə bilərsiniz',
    },
  },
  height: { type: Number },
  weight: { type: Number },
  birthDate: { type: Date },
  job: { type: String, maxlength: 100 },
  education: { type: String, maxlength: 100 },
  likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedUsers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dislikedAt: { type: Date, default: Date.now },
  }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: Date },
  premiumPlan: {
    type: String,
    enum: ['gold', 'platinum'],
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  pushToken: { type: String, default: null },
  coins: { type: Number, default: 10 },
  freeMessagesLeft: { type: Number, default: 10 },
  lastFreeMessageReset: { type: Date, default: Date.now },
  verificationCode: { type: String, select: false },
  verificationCodeExpires: { type: Date, select: false },
  refreshToken: { type: String, select: false },
}, {
  timestamps: true,
});

// Şifrəni saxlamadan əvvəl hashla
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Şifrəni yoxla
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);