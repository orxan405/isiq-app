const express = require('express');
const router = express.Router();
const { register, login, googleAuth, verifyEmail, resendVerification, refresh, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify', verifyEmail);
router.post('/resend', resendVerification);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;