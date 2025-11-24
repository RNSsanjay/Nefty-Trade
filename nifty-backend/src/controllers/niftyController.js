const { asyncHandler } = require('../middleware/errorHandler');
const niftyDataService = require('../services/niftyDataService');
const NiftyData = require('../models/NiftyData');

/**
 * @desc    Get live Nifty 50 data
 * @route   GET /api/nifty/live
 * @access  Public
 */
const getLiveNiftyData = asyncHandler(async (req, res) => {
  const liveData = await niftyDataService.getLiveData();
  
  res.status(200).json({
    success: true,
    data: liveData,
    timestamp: new Date().toISOString()
  });
});

/**
 * @desc    Get historical Nifty 50 data
 * @route   GET /api/nifty/history
 * @access  Public
 */
const getHistoricalNiftyData = asyncHandler(async (req, res) => {
  const { date, interval = 'day' } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date parameter is required (format: YYYY-MM-DD)'
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  // Validate interval
  const validIntervals = ['1min', '5min', '15min', '30min', '1h', 'day'];
  if (!validIntervals.includes(interval)) {
    return res.status(400).json({
      success: false,
      error: `Invalid interval. Valid values: ${validIntervals.join(', ')}`
    });
  }

  try {
    // First check database for cached data
    const cachedData = await NiftyData.find({
      date,
      interval,
      timestamp: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ timestamp: 1 });

    if (cachedData.length > 0) {
      return res.status(200).json({
        success: true,
        data: cachedData.map(item => ({
          timestamp: item.timestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          interval: item.interval
        })),
        source: 'cache',
        count: cachedData.length
      });
    }

    // Fetch from external API
    const historicalData = await niftyDataService.getHistoricalData(date, interval);

    // Save to database for future use
    if (historicalData.length > 0) {
      const dataToSave = historicalData.map(item => ({
        ...item,
        symbol: 'NIFTY 50',
        ltp: item.close,
        change: item.close - item.open,
        changePercent: ((item.close - item.open) / item.open) * 100
      }));

      await NiftyData.insertMany(dataToSave, { ordered: false }).catch(err => {
        console.warn('Some data already exists in database:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      data: historicalData,
      source: 'api',
      count: historicalData.length
    });

  } catch (error) {
    console.error('Error in getHistoricalNiftyData:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch historical data'
    });
  }
});

/**
 * @desc    Get Nifty data for multiple dates
 * @route   GET /api/nifty/range
 * @access  Public
 */
const getNiftyDataRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, interval = 'day' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Both startDate and endDate are required'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return res.status(400).json({
      success: false,
      error: 'startDate must be before endDate'
    });
  }

  const data = await NiftyData.find({
    interval,
    timestamp: {
      $gte: start,
      $lte: end
    }
  }).sort({ timestamp: 1 });

  res.status(200).json({
    success: true,
    data: data.map(item => ({
      timestamp: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      change: item.change,
      changePercent: item.changePercent
    })),
    count: data.length
  });
});

/**
 * @desc    Get market status
 * @route   GET /api/nifty/status
 * @access  Public
 */
const getMarketStatus = asyncHandler(async (req, res) => {
  const status = niftyDataService.getMarketStatus();
  
  res.status(200).json({
    success: true,
    data: {
      status,
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Kolkata'
    }
  });
});

module.exports = {
  getLiveNiftyData,
  getHistoricalNiftyData,
  getNiftyDataRange,
  getMarketStatus
};