const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMessages,
  sendMessage,
  getUnreadCount,
  deleteMessage,
} = require('../controllers/messageController');

router.get('/unread/count', protect, getUnreadCount);
router.get('/:matchId', protect, getMessages);
router.post('/:matchId', protect, sendMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;