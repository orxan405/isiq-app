const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');

// Çıxarış sorğusu yarat
router.post('/request', protect, async (req, res) => {
  try {
    const { coins, bankCard, cardHolder } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    if (coins < 500) {
      return res.status(400).json({ success: false, message: 'Minimum 500 coin çıxara bilərsiniz' });
    }

    if (user.coins < coins) {
      return res.status(400).json({ success: false, message: 'Kifayət qədər coin yoxdur' });
    }

    if (!bankCard || !cardHolder) {
      return res.status(400).json({ success: false, message: 'Kart məlumatları tələb olunur' });
    }

    const amount = (coins / 100).toFixed(2);

    // Coini tut (azalt)
    user.coins -= coins;
    await user.save();

    const request = await WithdrawalRequest.create({
      userId: req.user.id,
      coins,
      amount,
      bankCard,
      cardHolder,
    });

    res.status(201).json({
      success: true,
      message: `${coins} coin çıxarış sorğusu göndərildi. $${amount} 1-3 iş günü ərzində kartınıza köçürüləcək.`,
      request,
      coinsLeft: user.coins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Çıxarış tarixçəsi
router.get('/history', protect, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;