const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const User = require('../models/User');
const Match = require('../models/Match');
const { sendPushNotification } = require('../utils/pushNotification');

const APP_ID = '0a035c0d7f1f4bc29c7bf498af6d7cdc';
const APP_CERTIFICATE = '564e31c17dce47fbb6b0d961282265a2';

let activeStreams = {};

// @POST /api/v1/live/token
router.post('/token', protect, async (req, res) => {
  try {
    const { channelName, role } = req.body;
    if (!channelName) {
      return res.status(400).json({ success: false, message: 'Channel adı tələb olunur' });
    }
    const uid = 0;
    const expirationTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expirationTime;
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID, APP_CERTIFICATE, channelName, uid,
      rtcRole, privilegeExpiredTs, privilegeExpiredTs
    );
    res.json({ success: true, token, appId: APP_ID, channelName, uid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/start
router.post('/start', protect, async (req, res) => {
  try {
    const { title, hasVideo } = req.body;
    const channelName = `live_${req.user._id}_${Date.now()}`;
    activeStreams[channelName] = {
      channelName,
      hostId: req.user._id,
      hostName: req.user.name,
      hostPhoto: req.user.photos?.[0] || null,
      title: title || `${req.user.name}-nin yayımı`,
      hasVideo: hasVideo !== false,
      viewerCount: 0,
      giftCount: 0,
      startedAt: new Date(),
    };
    res.json({ success: true, channelName, stream: activeStreams[channelName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/end
router.post('/end', protect, async (req, res) => {
  try {
    const { channelName } = req.body;
    if (activeStreams[channelName]) {
      delete activeStreams[channelName];
    }
    res.json({ success: true, message: 'Yayım bitdi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/v1/live/streams
router.get('/streams', protect, async (req, res) => {
  try {
    const streams = Object.values(activeStreams);
    res.json({ success: true, streams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/live/viewer
router.put('/viewer', protect, async (req, res) => {
  try {
    const { channelName, action } = req.body;
    if (activeStreams[channelName]) {
      if (action === 'join') {
        activeStreams[channelName].viewerCount++;
      } else if (action === 'leave') {
        activeStreams[channelName].viewerCount = Math.max(0, activeStreams[channelName].viewerCount - 1);
      }
    }
    res.json({ success: true, stream: activeStreams[channelName] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/gift — Hədiyyə göndər
router.post('/gift', protect, async (req, res) => {
  try {
    const { channelName, giftId } = req.body;

    const GIFT_COSTS = {
      rose: 10, chocolate: 15, gift: 20, bouquet: 30,
      bear: 35, cake: 40, diamond: 45, ring: 50, travel: 100,
    };

    const cost = GIFT_COSTS[giftId];
    if (!cost) {
      return res.status(400).json({ success: false, message: 'Yanlış hədiyyə' });
    }

    const sender = await User.findById(req.user._id);
    if (sender.coins < cost) {
      return res.status(402).json({ success: false, message: 'Kifayət qədər coin yoxdur' });
    }

    // Göndərənin coinini azalt
    sender.coins -= cost;
    await sender.save({ validateBeforeSave: false });

    // Yayımçının coinini artır
    const stream = activeStreams[channelName];
    if (stream) {
      activeStreams[channelName].giftCount++;
      await User.findByIdAndUpdate(stream.hostId, { $inc: { coins: cost } });
    }

    res.json({ success: true, coinsLeft: sender.coins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/invite — Match-lərə dəvət göndər
router.post('/invite', protect, async (req, res) => {
  try {
    const { channelName, title } = req.body;

    const stream = activeStreams[channelName];
    if (!stream) {
      return res.status(404).json({ success: false, message: 'Yayım tapılmadı' });
    }

    // Match-ləri tap
    const matches = await Match.find({
      users: req.user._id,
      isActive: true,
    }).populate('users', 'name pushToken');

    let sentCount = 0;

    for (const match of matches) {
      const otherUser = match.users.find(
        (u) => u._id.toString() !== req.user._id.toString()
      );

      if (otherUser?.pushToken) {
        try {
          await sendPushNotification(
            otherUser.pushToken,
            '📡 Canlı Yayım Dəvəti!',
            `${req.user.name} canlı yayım başlatdı: ${title}`,
            {
              type: 'live',
              channelName,
              hostName: req.user.name,
              hostPhoto: req.user.photos?.[0] || '',
              title,
              hasVideo: stream.hasVideo ? 'true' : 'false',
            }
          );
          sentCount++;
        } catch (pushError) {
          console.log('Push xətası:', pushError.message);
        }
      }
    }

    res.json({ success: true, message: `${sentCount} nəfərə dəvət göndərildi` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});




module.exports = router;