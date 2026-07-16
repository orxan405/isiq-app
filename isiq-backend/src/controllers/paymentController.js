require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');

// Coin paketləri
const COIN_PACKAGES = {
  small: { coins: 50, amount: 299, currency: 'usd', label: '50 Coin' },
  medium: { coins: 150, amount: 699, currency: 'usd', label: '150 Coin' },
  large: { coins: 500, amount: 1799, currency: 'usd', label: '500 Coin' },
};

// Coin balansını göstər
exports.getCoinBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      coins: user.coins,
      freeMessagesLeft: user.freeMessagesLeft,
      packages: COIN_PACKAGES,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ödəniş intent yarat
exports.createPaymentIntent = async (req, res) => {
  try {
    const { package: packageId } = req.body;

    const package_ = COIN_PACKAGES[packageId];
    if (!package_) {
      return res.status(400).json({ success: false, message: 'Yanlış paket' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: package_.amount,
      currency: package_.currency,
      metadata: {
        userId: req.user.id,
        packageId,
        coins: package_.coins,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      package: package_,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ödənişi təsdiqlə və coin əlavə et
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const { userId, coins } = paymentIntent.metadata;

    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'İcazə yoxdur' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { coins: parseInt(coins) } },
      { new: true }
    );

    try {
      await CoinTransaction.create({
        userId,
        type: 'purchase',
        amount: parseInt(coins),
        description: `${coins} coin alındı (Stripe)`,
      });
      console.log('Purchase transaction yaradıldı');
    } catch (txError) {
      console.log('Purchase transaction xətası:', txError.message);
    }

    res.json({
      success: true,
      message: `${coins} coin əlavə edildi!`,
      coins: user.coins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Coin xərclə
exports.spendCoinEndpoint = async (req, res) => {
  try {
    const { amount, reason, receiverId } = req.body;
    console.log('Spend coin:', { amount, reason, receiverId, userId: req.user.id });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    if (user.coins < amount) {
      return res.status(402).json({ success: false, message: 'Coin yoxdur' });
    }

    // Göndərənin coini azalt
    user.coins -= amount;
    await user.save();

    // Göndərən üçün transaction log
    try {
      await CoinTransaction.create({
        userId: req.user.id,
        type: reason?.startsWith('gift') ? 'gift_sent' : 'superlike',
        amount: -amount,
        description: `${amount} coin xərcləndi — ${reason || ''}`,
        relatedUserId: receiverId || null,
      });
      console.log('Transaction yaradıldı — göndərən');
    } catch (txError) {
      console.log('Transaction xətası (göndərən):', txError.message);
    }

    // Alıcının coini artır
    if (receiverId) {
      await User.findByIdAndUpdate(
        receiverId,
        { $inc: { coins: amount } },
        { new: true }
      );

      // Alıcı üçün transaction log
      try {
        await CoinTransaction.create({
          userId: receiverId,
          type: 'gift_received',
          amount: amount,
          description: `${amount} coin hədiyyə alındı`,
          relatedUserId: req.user.id,
        });
        console.log('Transaction yaradıldı — alıcı');
      } catch (txError) {
        console.log('Transaction xətası (alıcı):', txError.message);
      }
    }

    res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.log('SpendCoin xətası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mesaj göndərərkən coin yoxla və azalt (daxili funksiya)
exports.spendCoin = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) return { success: false, message: 'İstifadəçi tapılmadı' };

    if (user.freeMessagesLeft === undefined || user.freeMessagesLeft === null) {
      user.freeMessagesLeft = 0;
    }

    if (user.freeMessagesLeft > 0) {
      user.freeMessagesLeft -= 1;
      await user.save();
      return { success: true, free: true, freeMessagesLeft: user.freeMessagesLeft };
    }

    if (!user.coins || user.coins <= 0) {
      return { success: false, message: 'Coin yoxdur. Coin al!' };
    }

    user.coins -= 1;
    await user.save();
    return { success: true, free: false, coins: user.coins };
  } catch (error) {
    return { success: false, message: error.message };
  }
};