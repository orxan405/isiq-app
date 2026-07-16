const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const CoinTransaction = require('../models/CoinTransaction');
const Notification = require('../models/Notification');

// @GET /api/v1/admin/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const [users, matches, messages, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments({ isActive: true }),
      Message.countDocuments(),
      WithdrawalRequest.countDocuments({ status: 'pending' }),
      WithdrawalRequest.countDocuments({ status: 'approved' }),
      WithdrawalRequest.countDocuments({ status: 'rejected' }),
    ]);

    res.json({
      success: true,
      stats: {
        users,
        matches,
        messages,
        pendingWithdrawals,
        approvedWithdrawals,
        rejectedWithdrawals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/admin/users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('name email age gender city isActive isPremium coins createdAt photos')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/admin/users/:id/details
router.get('/users/:id/details', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -verificationCode -verificationCodeExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    const [matches, messages, withdrawals, notifications] = await Promise.all([
      Match.countDocuments({ users: req.params.id, isActive: true }),
      Message.countDocuments({ senderId: req.params.id }),
      WithdrawalRequest.find({ userId: req.params.id }).sort({ createdAt: -1 }),
      Notification.countDocuments({ userId: req.params.id }),
    ]);

    res.json({
      success: true,
      user,
      stats: { matches, messages, withdrawals: withdrawals.length, notifications },
      withdrawalHistory: withdrawals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/admin/users/:id/block
router.put('/users/:id/block', protect, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: 'İstifadəçi bloklandı', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/admin/users/:id/unblock
router.put('/users/:id/unblock', protect, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ success: true, message: 'İstifadəçi blokdan çıxarıldı', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/v1/admin/users/:id
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'İstifadəçi silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/admin/users/:id/coins
router.put('/users/:id/coins', protect, admin, async (req, res) => {
  try {
    const { coins } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { coins: parseInt(coins) } },
      { new: true }
    );
    res.json({ success: true, message: `${coins} coin əlavə edildi`, coins: user.coins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/admin/withdrawals
router.get('/withdrawals', protect, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/admin/withdrawals/:id/approve
router.put('/withdrawals/:id/approve', protect, admin, async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', note: req.body?.note || '' },
      { new: true }
    ).populate('userId', 'name email');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Sorğu tapılmadı' });
    }

    res.json({ success: true, message: 'Çıxarış təsdiqləndi', withdrawal });
  } catch (error) {
    console.log('Approve xətası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/admin/withdrawals/:id/reject
router.put('/withdrawals/:id/reject', protect, admin, async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Sorğu tapılmadı' });
    }

    await User.findByIdAndUpdate(
      withdrawal.userId,
      { $inc: { coins: withdrawal.coins } }
    );

    const updated = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', note: req.body?.note || '' },
      { new: true }
    ).populate('userId', 'name email');

    res.json({ success: true, message: 'Çıxarış rədd edildi', withdrawal: updated });
  } catch (error) {
    console.log('Reject xətası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/admin/transactions
router.get('/transactions', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const filter = userId ? { userId } : {};

    const transactions = await CoinTransaction.find(filter)
      .populate('userId', 'name email')
      .populate('relatedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CoinTransaction.countDocuments(filter);
    res.json({ success: true, transactions, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/admin/notifications
router.get('/notifications', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await Notification.find()
      .populate('userId', 'name email')
      .populate('fromUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments();
    res.json({ success: true, notifications, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;