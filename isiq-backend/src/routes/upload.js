const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'isiq-app',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'mov', 'avi']
        : ['jpg', 'jpeg', 'png', 'webp'],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Yalnız şəkil və ya video formatları qəbul edilir'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (video üçün)
});

// @POST /api/v1/upload/photo
router.post('/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fayl seçilməyib' });
    }

    const user = await User.findById(req.user._id);

    if (user.photos.length >= 6) {
      return res.status(400).json({ success: false, message: 'Maksimum 6 media yükləyə bilərsiniz' });
    }

    const fileUrl = req.file.path;
    user.photos.push(fileUrl);
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, message: 'Yükləndi', photoUrl: fileUrl, photos: user.photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/v1/upload/photo
router.delete('/photo', protect, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.photos.includes(photoUrl)) {
      return res.status(404).json({ success: false, message: 'Tapılmadı' });
    }

    user.photos = user.photos.filter((p) => p !== photoUrl);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Silindi', photos: user.photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/v1/upload/message-photo
router.post('/message-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fayl seçilməyib' });
    }

    res.status(201).json({ success: true, photoUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;