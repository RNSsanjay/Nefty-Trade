const express = require('express');
const {
  getLiveOptionData,
  getOptionChain,
  getHistoricalOptionData,
  getAvailableExpiries,
  getAvailableStrikes
} = require('../controllers/optionsController');

const router = express.Router();

// @route   GET /api/options/live
// @desc    Get real-time LTP for specific strike, CE/PE, expiry
// @access  Public
router.get('/live', getLiveOptionData);

// @route   GET /api/options/chain
// @desc    Get complete option chain
// @access  Public
router.get('/chain', getOptionChain);

// @route   GET /api/options/history
// @desc    Get historical option data
// @access  Public
router.get('/history', getHistoricalOptionData);

// @route   GET /api/options/expiries
// @desc    Get available expiry dates
// @access  Public
router.get('/expiries', getAvailableExpiries);

// @route   GET /api/options/strikes
// @desc    Get available strikes around current price
// @access  Public
router.get('/strikes', getAvailableStrikes);

module.exports = router;