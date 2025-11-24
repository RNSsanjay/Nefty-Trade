const mongoose = require('mongoose');

const niftyDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    default: 'NIFTY 50'
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  ltp: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    required: true
  },
  changePercent: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    default: 0
  },
  interval: {
    type: String,
    enum: ['1min', '5min', '15min', '30min', '1h', 'day'],
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
niftyDataSchema.index({ date: 1, interval: 1, timestamp: 1 });
niftyDataSchema.index({ timestamp: -1 }); // For latest data queries

const NiftyData = mongoose.model('NiftyData', niftyDataSchema);

module.exports = NiftyData;