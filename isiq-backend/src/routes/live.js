const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const APP_ID = '0a035c0d7f1f4bc29c7bf498af6d7cdc';
const APP_CERTIFICATE = '564e31c17dce47fbb6b0d961282265a2';

// Aktiv yayımlar (memory-də saxlanılır, sonra MongoDB-yə keçərik)
let activeStreams = {};

// @POST /api/v1/live/token — Agora token yarat
router.post('/token', protect, async (req, res) => {
  try {
    const { channelName, role } = req.body;

    if (!channelName) {
      return res.status(400).json({ success: false, message: 'Channel adı tələb olunur' });
    }

    const uid = 0;
    const expirationTime = 3600; // 1 saat
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expirationTime;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    res.json({ success: true, token, appId: APP_ID, channelName, uid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/start — Yayım başlat
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

    res.json({
      success: true,
      channelName,
      stream: activeStreams[channelName],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/live/end — Yayımı bitir
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

// @GET /api/v1/live/streams — Aktiv yayımlar
router.get('/streams', protect, async (req, res) => {
  try {
    const streams = Object.values(activeStreams);
    res.json({ success: true, streams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/v1/live/viewer — İzləyici sayı yenilə
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

module.exports = router;