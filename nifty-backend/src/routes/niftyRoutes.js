const express = require('express');
const {
  getLiveNiftyData,
  getHistoricalNiftyData,
  getNiftyDataRange,
  getMarketStatus
} = require('../controllers/niftyController');

const router = express.Router();

// @route   GET /api/nifty/live
// @desc    Get current Nifty 50 index value, OHLC, % change
// @access  Public
router.get('/live', getLiveNiftyData);

// @route   GET /api/nifty/history
// @desc    Get historical Nifty data for specific date and interval
// @access  Public
router.get('/history', getHistoricalNiftyData);

// @route   GET /api/nifty/range
// @desc    Get Nifty data for date range
// @access  Public
router.get('/range', getNiftyDataRange);

// @route   GET /api/nifty/status
// @desc    Get market status
// @access  Public
router.get('/status', getMarketStatus);

module.exports = router;