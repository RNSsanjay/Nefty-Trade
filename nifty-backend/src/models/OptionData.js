const mongoose = require('mongoose');

const optionDataSchema = new mongoose.Schema({
  strike: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['CE', 'PE'],
    required: true,
    index: true
  },
  expiry: {
    type: Date,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  ltp: {
    type: Number,
    required: true
  },
  open: {
    type: Number,
    default: 0
  },
  high: {
    type: Number,
    default: 0
  },
  low: {
    type: Number,
    default: 0
  },
  close: {
    type: Number,
    default: 0
  },
  volume: {
    type: Number,
    default: 0
  },
  oi: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  iv: {
    type: Number,
    default: 0
  },
  delta: {
    type: Number,
    default: 0
  },
  gamma: {
    type: Number,
    default: 0
  },
  theta: {
    type: Number,
    default: 0
  },
  vega: {
    type: Number,
    default: 0
  },
  interval: {
    type: String,
    enum: ['1min', '5min', '15min', '30min', '1h', 'day'],
    default: '1min'
  },
  date: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
optionDataSchema.index({ strike: 1, type: 1, expiry: 1, timestamp: -1 });
optionDataSchema.index({ expiry: 1, timestamp: -1 });
optionDataSchema.index({ date: 1, interval: 1 });

const OptionData = mongoose.model('OptionData', optionDataSchema);

module.exports = OptionData;