const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getCoinBalance,
  spendCoinEndpoint,
} = require('../controllers/paymentController');

router.get('/balance', protect, getCoinBalance);
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.post('/spend', protect, spendCoinEndpoint);

module.exports = router;