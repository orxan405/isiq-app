const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  discoverUsers,
  getUserById,
  updateProfile,
  updateSettings,
  deleteAccount,
  blockUser,
  updatePushToken,
} = require('../controllers/userController');

router.get('/discover', protect, discoverUsers);
router.get('/:id', protect, getUserById);
router.put('/profile/update', protect, updateProfile);
router.put('/push-token', protect, updatePushToken);
router.put('/settings', protect, updateSettings);
router.delete('/account', protect, deleteAccount);
router.post('/:id/block', protect, blockUser);

module.exports = router;