const express = require('express');
const {
  placeOrder,
  getOrders,
  getPortfolio,
  resetPortfolio
} = require('../controllers/paperTradeController');
const {
  getDetailedPnL
} = require('../controllers/pnlController');

const router = express.Router();

// @route   POST /api/papertrade/orders
// @desc    Place a paper trade order (virtual buy/sell)
// @access  Public
router.post('/orders', placeOrder);

// @route   GET /api/papertrade/orders
// @desc    Get order history and active positions
// @access  Public
router.get('/orders', getOrders);

// @route   GET /api/papertrade/portfolio
// @desc    Get portfolio with positions and P&L
// @access  Public
router.get('/portfolio', getPortfolio);

// @route   GET /api/papertrade/pnl
// @desc    Get detailed P&L calculations with risk metrics
// @access  Public
router.get('/pnl', getDetailedPnL);

// @route   POST /api/papertrade/reset
// @desc    Reset portfolio to initial state
// @access  Public
router.post('/reset', resetPortfolio);

module.exports = router;