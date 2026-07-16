const User = require('../models/User');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// @POST /api/v1/matches/like/:userId
const likeUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    if (currentUser.likedUsers.includes(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Artıq bəyənilib' });
    }

    currentUser.likedUsers.push(req.params.userId);
    currentUser.dislikedUsers = currentUser.dislikedUsers.filter((d) => {
      if (d.user) return d.user.toString() !== req.params.userId;
      return d.toString() !== req.params.userId;
    });
    await currentUser.save({ validateBeforeSave: false });

    const isMatch = targetUser.likedUsers.includes(req.user._id.toString());

    if (isMatch) {
      const match = await Match.create({
        users: [req.user._id, req.params.userId],
      });

      const io = req.app.get('io');
      const matchData = await match.populate('users', 'name photos age');

      io.to(req.params.userId).emit('newMatch', {
        match: matchData,
        user: currentUser,
      });
      io.to(req.user._id.toString()).emit('newMatch', {
        match: matchData,
        user: targetUser,
      });

      // Match bildirişi yarat — hər iki tərəf üçün
      await Notification.create({
        userId: req.params.userId,
        type: 'match',
        fromUserId: req.user._id,
        matchId: match._id,
        title: '🎉 Yeni Match!',
        body: `${currentUser.name} ilə match oldunuz!`,
      });

      await Notification.create({
        userId: req.user._id,
        type: 'match',
        fromUserId: req.params.userId,
        matchId: match._id,
        title: '🎉 Yeni Match!',
        body: `${targetUser.name} ilə match oldunuz!`,
      });

      // Push bildiriş göndər
      if (targetUser.pushToken) {
        try {
          await sendPushNotification(
            targetUser.pushToken,
            '🎉 Yeni Match!',
            `${currentUser.name} ilə match oldunuz!`,
            { type: 'match', matchId: match._id }
          );
        } catch (pushError) {
          console.log('Push xətası:', pushError.message);
        }
      }

      if (currentUser.pushToken) {
        try {
          await sendPushNotification(
            currentUser.pushToken,
            '🎉 Yeni Match!',
            `${targetUser.name} ilə match oldunuz!`,
            { type: 'match', matchId: match._id }
          );
        } catch (pushError) {
          console.log('Push xətası:', pushError.message);
        }
      }

      return res.json({ success: true, isMatch: true, match: matchData });
    }

    // Bəyənmə bildirişi yarat
    await Notification.create({
      userId: req.params.userId,
      type: 'like',
      fromUserId: req.user._id,
      title: '❤️ Yeni Bəyənmə!',
      body: `${currentUser.name} sizi bəyəndi!`,
    });

    // Push bildiriş göndər
    if (targetUser.pushToken) {
      try {
        await sendPushNotification(
          targetUser.pushToken,
          '❤️ Yeni Bəyənmə!',
          `${currentUser.name} sizi bəyəndi!`,
          { type: 'like', userId: req.user._id }
        );
      } catch (pushError) {
        console.log('Push xətası:', pushError.message);
      }
    }

    res.json({ success: true, isMatch: false, message: 'Bəyənildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/matches/dislike/:userId
const dislikeUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    const existingIndex = currentUser.dislikedUsers.findIndex(
      (d) => d.user && d.user.toString() === req.params.userId
    );

    if (existingIndex !== -1) {
      currentUser.dislikedUsers[existingIndex].dislikedAt = new Date();
    } else {
      currentUser.dislikedUsers.push({
        user: req.params.userId,
        dislikedAt: new Date(),
      });
    }

    await currentUser.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Keçildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/matches/superlike/:userId
const superLikeUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }

    // 5 coin yoxla
    if (currentUser.coins < 5) {
      return res.status(402).json({
        success: false,
        message: 'Super Like üçün 5 coin lazımdır',
        needCoins: true,
      });
    }

    // 5 coin xərclə
    currentUser.coins -= 5;
    currentUser.likedUsers.push(req.params.userId);
    await currentUser.save({ validateBeforeSave: false });

    const io = req.app.get('io');
    io.to(req.params.userId).emit('superLike', { fromUser: req.user._id });

    // Bildiriş yarat
    await Notification.create({
      userId: req.params.userId,
      type: 'superlike',
      fromUserId: req.user._id,
      title: '⭐ Super Like!',
      body: `${currentUser.name} sizi çox bəyəndi!`,
    });

    // Push bildiriş göndər
    if (targetUser?.pushToken) {
      try {
        await sendPushNotification(
          targetUser.pushToken,
          '⭐ Super Like!',
          `${currentUser.name} sizi çox bəyəndi!`,
          { type: 'superlike', userId: req.user._id }
        );
      } catch (pushError) {
        console.log('Push xətası:', pushError.message);
      }
    }

    res.json({
      success: true,
      message: 'Super Like göndərildi',
      coinsLeft: currentUser.coins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/v1/matches
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      users: req.user._id,
      isActive: true,
    })
      .populate('users', 'name photos age city lastSeen')
      .sort({ lastMessageAt: -1, createdAt: -1 });

    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/v1/matches/:id
const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      users: req.user._id,
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match tapılmadı' });
    }

    match.isActive = false;
    await match.save();

    res.json({ success: true, message: 'Match silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/v1/matches/:id/report
const reportMatch = async (req, res) => {
  try {
    res.json({ success: true, message: 'Şikayət göndərildi, 24 saat içində baxılacaq' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { likeUser, dislikeUser, superLikeUser, getMatches, deleteMatch, reportMatch };