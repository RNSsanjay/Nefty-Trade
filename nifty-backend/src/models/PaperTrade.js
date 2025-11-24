const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  symbol: {
    type: String,
    required: true
  },
  strike: {
    type: Number
  },
  type: {
    type: String,
    enum: ['CE', 'PE', 'INDEX']
  },
  expiry: {
    type: Date
  },
  side: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
    default: 'MARKET'
  },
  limitPrice: {
    type: Number
  },
  stopPrice: {
    type: Number
  },
  entryPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number
  },
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'FILLED', 'PARTIAL', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  },
  orderTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  fillTime: {
    type: Date
  },
  lotSize: {
    type: Number,
    default: 50
  },
  totalValue: {
    type: Number,
    required: true
  },
  sessionId: {
    type: String,
    default: 'default'
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient querying
orderSchema.index({ sessionId: 1, orderTime: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ strike: 1, type: 1, expiry: 1 });

const Order = mongoose.model('Order', orderSchema);

// Portfolio schema for tracking overall position
const portfolioSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: 'default'
  },
  balance: {
    type: Number,
    required: true,
    default: 1000000
  },
  totalPnl: {
    type: Number,
    default: 0
  },
  dayPnl: {
    type: Number,
    default: 0
  },
  positions: [{
    orderId: {
      type: String,
      required: true
    },
    symbol: String,
    strike: Number,
    type: String,
    expiry: Date,
    quantity: Number,
    avgPrice: Number,
    currentPrice: Number,
    pnl: Number,
    pnlPercent: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = { Order, Portfolio };