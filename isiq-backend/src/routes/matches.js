const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  likeUser,
  dislikeUser,
  superLikeUser,
  getMatches,
  deleteMatch,
  reportMatch,
} = require('../controllers/matchController');

router.post('/like/:userId', protect, likeUser);
router.post('/dislike/:userId', protect, dislikeUser);
router.post('/superlike/:userId', protect, superLikeUser);
router.get('/', protect, getMatches);
router.delete('/:id', protect, deleteMatch);
router.post('/:id/report', protect, reportMatch);

module.exports = router;