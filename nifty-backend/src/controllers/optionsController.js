const { asyncHandler } = require('../middleware/errorHandler');
const optionsDataService = require('../services/optionsDataService');
const OptionData = require('../models/OptionData');

/**
 * @desc    Get live option data for specific strike
 * @route   GET /api/options/live
 * @access  Public
 */
const getLiveOptionData = asyncHandler(async (req, res) => {
  const { strike, type, expiry } = req.query;

  // Validate required parameters
  if (!strike || !type || !expiry) {
    return res.status(400).json({
      success: false,
      error: 'strike, type, and expiry parameters are required'
    });
  }

  // Validate type
  if (!['CE', 'PE'].includes(type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'type must be either CE or PE'
    });
  }

  // Validate strike is numeric
  if (isNaN(parseInt(strike))) {
    return res.status(400).json({
      success: false,
      error: 'strike must be a valid number'
    });
  }

  // Validate expiry date
  const expiryDate = new Date(expiry);
  if (isNaN(expiryDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid expiry date format. Use YYYY-MM-DD'
    });
  }

  try {
    const optionData = await optionsDataService.getLiveOptionData(
      parseInt(strike),
      type.toUpperCase(),
      expiryDate
    );

    res.status(200).json({
      success: true,
      data: optionData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getLiveOptionData:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch live option data'
    });
  }
});

/**
 * @desc    Get complete option chain
 * @route   GET /api/options/chain
 * @access  Public
 */
const getOptionChain = asyncHandler(async (req, res) => {
  const { expiry } = req.query;

  try {
    let chainData = await optionsDataService.getOptionChain();

    // Filter by expiry if provided
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (!isNaN(expiryDate.getTime())) {
        chainData = chainData.filter(option => 
          option.expiry.toDateString() === expiryDate.toDateString()
        );
      }
    }

    // Group by strike for easier frontend consumption
    const groupedData = chainData.reduce((acc, option) => {
      const strike = option.strike;
      if (!acc[strike]) {
        acc[strike] = { strike };
      }
      acc[strike][option.type] = {
        ltp: option.ltp,
        open: option.open,
        high: option.high,
        low: option.low,
        close: option.close,
        volume: option.volume,
        oi: option.oi,
        change: option.change,
        changePercent: option.changePercent,
        iv: option.iv,
        expiry: option.expiry
      };
      return acc;
    }, {});

    const formattedChain = Object.values(groupedData).sort((a, b) => a.strike - b.strike);

    res.status(200).json({
      success: true,
      data: formattedChain,
      count: formattedChain.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in getOptionChain:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch option chain'
    });
  }
});

/**
 * @desc    Get historical option data
 * @route   GET /api/options/history
 * @access  Public
 */
const getHistoricalOptionData = asyncHandler(async (req, res) => {
  const { strike, type, expiry, date, interval = 'day' } = req.query;

  // Validate required parameters
  if (!strike || !type || !expiry || !date) {
    return res.status(400).json({
      success: false,
      error: 'strike, type, expiry, and date parameters are required'
    });
  }

  // Validate parameters
  if (!['CE', 'PE'].includes(type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'type must be either CE or PE'
    });
  }

  if (isNaN(parseInt(strike))) {
    return res.status(400).json({
      success: false,
      error: 'strike must be a valid number'
    });
  }

  const validIntervals = ['1min', '5min', '15min', '30min', '1h', 'day'];
  if (!validIntervals.includes(interval)) {
    return res.status(400).json({
      success: false,
      error: `Invalid interval. Valid values: ${validIntervals.join(', ')}`
    });
  }

  try {
    // First check database
    const cachedData = await OptionData.find({
      strike: parseInt(strike),
      type: type.toUpperCase(),
      expiry: new Date(expiry),
      date,
      interval
    }).sort({ timestamp: 1 });

    if (cachedData.length > 0) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        source: 'cache',
        count: cachedData.length
      });
    }

    // Fetch from service
    const historicalData = await optionsDataService.getHistoricalOptionData(
      parseInt(strike),
      type.toUpperCase(),
      new Date(expiry),
      date,
      interval
    );

    // Save to database
    if (historicalData.length > 0) {
      await OptionData.insertMany(historicalData, { ordered: false }).catch(err => {
        console.warn('Some option data already exists:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      data: historicalData,
      source: 'api',
      count: historicalData.length
    });

  } catch (error) {
    console.error('Error in getHistoricalOptionData:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch historical option data'
    });
  }
});

/**
 * @desc    Get available expiry dates
 * @route   GET /api/options/expiries
 * @access  Public
 */
const getAvailableExpiries = asyncHandler(async (req, res) => {
  try {
    const expiries = optionsDataService.getNextExpiryDates(6); // Get next 6 expiries
    
    res.status(200).json({
      success: true,
      data: expiries.map(date => ({
        date: date.toISOString().split('T')[0],
        formatted: date.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        daysToExpiry: Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
      })),
      count: expiries.length
    });
  } catch (error) {
    console.error('Error in getAvailableExpiries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available expiries'
    });
  }
});

/**
 * @desc    Get strikes around current price
 * @route   GET /api/options/strikes
 * @access  Public
 */
const getAvailableStrikes = asyncHandler(async (req, res) => {
  const { range = 10 } = req.query;
  
  try {
    // Get current Nifty price (you might want to import niftyDataService)
    const niftyDataService = require('../services/niftyDataService');
    const liveData = await niftyDataService.getLiveData();
    const currentPrice = liveData.ltp;
    
    // Generate strikes around current price
    const strikes = [];
    const baseStrike = Math.floor(currentPrice / 50) * 50; // Round to nearest 50
    const rangeNum = parseInt(range);
    
    for (let i = -rangeNum; i <= rangeNum; i++) {
      strikes.push(baseStrike + (i * 50));
    }
    
    res.status(200).json({
      success: true,
      data: {
        currentPrice,
        atm: baseStrike,
        strikes: strikes.map(strike => ({
          strike,
          moneyness: strike === baseStrike ? 'ATM' : 
                    strike < baseStrike ? 'ITM' : 'OTM',
          distance: Math.abs(strike - currentPrice)
        }))
      }
    });
  } catch (error) {
    console.error('Error in getAvailableStrikes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available strikes'
    });
  }
});

module.exports = {
  getLiveOptionData,
  getOptionChain,
  getHistoricalOptionData,
  getAvailableExpiries,
  getAvailableStrikes
};