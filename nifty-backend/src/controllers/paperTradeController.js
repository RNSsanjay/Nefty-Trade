const { asyncHandler } = require('../middleware/errorHandler');
const { Order, Portfolio } = require('../models/PaperTrade');
const niftyDataService = require('../services/niftyDataService');
const optionsDataService = require('../services/optionsDataService');
const config = require('../config/config');

/**
 * @desc    Place a paper trade order
 * @route   POST /api/papertrade/orders
 * @access  Public
 */
const placeOrder = asyncHandler(async (req, res) => {
  const {
    symbol = 'NIFTY',
    strike,
    type, // CE, PE, or INDEX
    expiry,
    side, // BUY or SELL
    quantity,
    orderType = 'MARKET',
    limitPrice,
    stopPrice,
    sessionId = 'default',
    tags = []
  } = req.body;

  // Validate required fields
  if (!side || !quantity) {
    return res.status(400).json({
      success: false,
      error: 'side and quantity are required'
    });
  }

  if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'side must be either BUY or SELL'
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      error: 'quantity must be greater than 0'
    });
  }

  // For options, validate additional fields
  if (type && ['CE', 'PE'].includes(type.toUpperCase())) {
    if (!strike || !expiry) {
      return res.status(400).json({
        success: false,
        error: 'strike and expiry are required for options'
      });
    }
  }

  try {
    // Get current price
    let currentPrice;
    if (type && ['CE', 'PE'].includes(type.toUpperCase())) {
      // Options
      const optionData = await optionsDataService.getLiveOptionData(
        parseInt(strike),
        type.toUpperCase(),
        new Date(expiry)
      );
      currentPrice = optionData.ltp;
    } else {
      // Index
      const niftyData = await niftyDataService.getLiveData();
      currentPrice = niftyData.ltp;
    }

    // Calculate entry price based on order type
    let entryPrice = currentPrice;
    if (orderType === 'LIMIT' && limitPrice) {
      entryPrice = limitPrice;
    }

    // Generate order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Calculate total value
    const lotSize = config.NIFTY_LOT_SIZE;
    const totalQuantity = quantity * lotSize;
    const totalValue = entryPrice * totalQuantity;

    // Get or create portfolio
    let portfolio = await Portfolio.findOne({ sessionId });
    if (!portfolio) {
      portfolio = new Portfolio({
        sessionId,
        balance: config.INITIAL_BALANCE
      });
      await portfolio.save();
    }

    // Check if user has sufficient balance for BUY orders
    if (side.toUpperCase() === 'BUY' && portfolio.balance < totalValue) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        available: portfolio.balance,
        required: totalValue
      });
    }

    // Create order
    const order = new Order({
      orderId,
      symbol,
      strike: strike ? parseInt(strike) : undefined,
      type: type ? type.toUpperCase() : 'INDEX',
      expiry: expiry ? new Date(expiry) : undefined,
      side: side.toUpperCase(),
      quantity,
      orderType,
      limitPrice,
      stopPrice,
      entryPrice,
      currentPrice,
      status: 'FILLED', // For paper trading, orders are immediately filled
      fillTime: new Date(),
      lotSize,
      totalValue,
      sessionId,
      tags
    });

    await order.save();

    // Update portfolio
    if (side.toUpperCase() === 'BUY') {
      portfolio.balance -= totalValue;
    } else {
      portfolio.balance += totalValue;
    }

    // Add to positions
    const existingPositionIndex = portfolio.positions.findIndex(pos => 
      pos.symbol === symbol &&
      pos.strike === (strike ? parseInt(strike) : undefined) &&
      pos.type === (type ? type.toUpperCase() : 'INDEX') &&
      (expiry ? pos.expiry?.getTime() === new Date(expiry).getTime() : !pos.expiry)
    );

    if (existingPositionIndex >= 0) {
      // Update existing position
      const position = portfolio.positions[existingPositionIndex];
      const newQuantity = side.toUpperCase() === 'BUY' ? 
        position.quantity + quantity : 
        position.quantity - quantity;
      
      if (newQuantity === 0) {
        // Close position
        portfolio.positions.splice(existingPositionIndex, 1);
      } else {
        // Update position
        const totalCost = (position.avgPrice * position.quantity) + 
          (side.toUpperCase() === 'BUY' ? totalValue : -totalValue);
        position.quantity = newQuantity;
        position.avgPrice = totalCost / (newQuantity * lotSize);
        position.currentPrice = currentPrice;
      }
    } else if (side.toUpperCase() === 'BUY') {
      // Create new position
      portfolio.positions.push({
        orderId,
        symbol,
        strike: strike ? parseInt(strike) : undefined,
        type: type ? type.toUpperCase() : 'INDEX',
        expiry: expiry ? new Date(expiry) : undefined,
        quantity,
        avgPrice: entryPrice,
        currentPrice,
        pnl: 0,
        pnlPercent: 0
      });
    }

    await portfolio.save();

    res.status(201).json({
      success: true,
      data: {
        order: {
          orderId: order.orderId,
          symbol: order.symbol,
          strike: order.strike,
          type: order.type,
          expiry: order.expiry,
          side: order.side,
          quantity: order.quantity,
          entryPrice: order.entryPrice,
          totalValue: order.totalValue,
          status: order.status,
          orderTime: order.orderTime
        },
        portfolio: {
          balance: portfolio.balance,
          totalPositions: portfolio.positions.length
        }
      }
    });

  } catch (error) {
    console.error('Error in placeOrder:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place order'
    });
  }
});

/**
 * @desc    Get all orders
 * @route   GET /api/papertrade/orders
 * @access  Public
 */
const getOrders = asyncHandler(async (req, res) => {
  const { 
    sessionId = 'default', 
    status, 
    symbol, 
    type,
    limit = 50,
    offset = 0 
  } = req.query;

  const filter = { sessionId };
  if (status) filter.status = status.toUpperCase();
  if (symbol) filter.symbol = symbol.toUpperCase();
  if (type) filter.type = type.toUpperCase();

  try {
    const orders = await Order.find(filter)
      .sort({ orderTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * @desc    Get portfolio and positions
 * @route   GET /api/papertrade/portfolio
 * @access  Public
 */
const getPortfolio = asyncHandler(async (req, res) => {
  const { sessionId = 'default' } = req.query;

  try {
    let portfolio = await Portfolio.findOne({ sessionId });
    
    if (!portfolio) {
      // Create default portfolio
      portfolio = new Portfolio({
        sessionId,
        balance: config.INITIAL_BALANCE
      });
      await portfolio.save();
    }

    // Update current prices and P&L for all positions
    for (let position of portfolio.positions) {
      try {
        let currentPrice;
        if (position.type && ['CE', 'PE'].includes(position.type)) {
          const optionData = await optionsDataService.getLiveOptionData(
            position.strike,
            position.type,
            position.expiry
          );
          currentPrice = optionData.ltp;
        } else {
          const niftyData = await niftyDataService.getLiveData();
          currentPrice = niftyData.ltp;
        }

        position.currentPrice = currentPrice;
        const priceDiff = currentPrice - position.avgPrice;
        position.pnl = priceDiff * position.quantity * config.NIFTY_LOT_SIZE;
        position.pnlPercent = (priceDiff / position.avgPrice) * 100;
      } catch (error) {
        console.error(`Error updating price for position ${position.orderId}:`, error.message);
      }
    }

    // Calculate total P&L
    portfolio.totalPnl = portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0);
    portfolio.lastUpdated = new Date();
    await portfolio.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId: portfolio.sessionId,
        balance: portfolio.balance,
        totalValue: portfolio.balance + portfolio.totalPnl,
        totalPnl: portfolio.totalPnl,
        dayPnl: portfolio.dayPnl,
        positions: portfolio.positions,
        summary: {
          totalPositions: portfolio.positions.length,
          profitablePositions: portfolio.positions.filter(p => p.pnl > 0).length,
          losingPositions: portfolio.positions.filter(p => p.pnl < 0).length,
          maxProfit: portfolio.positions.length > 0 ? 
            Math.max(...portfolio.positions.map(p => p.pnl)) : 0,
          maxLoss: portfolio.positions.length > 0 ? 
            Math.min(...portfolio.positions.map(p => p.pnl)) : 0
        },
        lastUpdated: portfolio.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error in getPortfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio'
    });
  }
});

/**
 * @desc    Reset portfolio
 * @route   POST /api/papertrade/reset
 * @access  Public
 */
const resetPortfolio = asyncHandler(async (req, res) => {
  const { sessionId = 'default' } = req.body;

  try {
    // Delete all orders for this session
    await Order.deleteMany({ sessionId });

    // Reset portfolio
    const portfolio = await Portfolio.findOneAndUpdate(
      { sessionId },
      {
        balance: config.INITIAL_BALANCE,
        totalPnl: 0,
        dayPnl: 0,
        positions: [],
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Portfolio reset successfully',
      data: {
        sessionId: portfolio.sessionId,
        balance: portfolio.balance,
        totalPnl: portfolio.totalPnl,
        positions: portfolio.positions
      }
    });

  } catch (error) {
    console.error('Error in resetPortfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset portfolio'
    });
  }
});

module.exports = {
  placeOrder,
  getOrders,
  getPortfolio,
  resetPortfolio
};