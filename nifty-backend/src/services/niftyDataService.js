const axios = require('axios');
const config = require('../config/config');

class NiftyDataService {
  constructor() {
    this.cache = new Map();
    this.lastFetch = null;
  }

  /**
   * Fetch live Nifty 50 data from NSE API
   */
  async getLiveData() {
    try {
      const cacheKey = 'nifty_live';
      const now = Date.now();
      
      // Check cache first (30 seconds cache)
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (now - cached.timestamp < 30000) {
          return cached.data;
        }
      }

      const response = await axios.get(`${config.NSE_API_BASE_URL}/quote/NIFTY%2050`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      const rawData = response.data;
      
      // Transform to standardized format
      const liveData = {
        symbol: 'NIFTY 50',
        ltp: parseFloat(rawData.lastPrice) || 0,
        open: parseFloat(rawData.open) || 0,
        high: parseFloat(rawData.dayHigh) || 0,
        low: parseFloat(rawData.dayLow) || 0,
        close: parseFloat(rawData.previousClose) || 0,
        change: parseFloat(rawData.change) || 0,
        changePercent: parseFloat(rawData.pChange) || 0,
        volume: parseInt(rawData.totalTradedVolume) || 0,
        timestamp: new Date().toISOString(),
        marketStatus: this.getMarketStatus()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: liveData,
        timestamp: now
      });

      return liveData;
    } catch (error) {
      console.error('Error fetching live Nifty data:', error.message);
      
      // Return cached data if available, otherwise fallback
      const cacheKey = 'nifty_live';
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }
      
      throw new Error('Failed to fetch live Nifty data');
    }
  }

  /**
   * Fetch historical Nifty data
   */
  async getHistoricalData(date, interval = 'day') {
    try {
      const cacheKey = `nifty_historical_${date}_${interval}`;
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // For historical data, we'll use Yahoo Finance API
      const symbol = '^NSEI'; // Yahoo Finance symbol for Nifty 50
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);
      
      const intervalMapping = {
        '1min': '1m',
        '5min': '5m',
        '15min': '15m',
        '30min': '30m',
        '1h': '1h',
        'day': '1d'
      };

      const yaInterval = intervalMapping[interval] || '1d';
      
      const url = `${config.YAHOO_FINANCE_BASE_URL}/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: {
          period1,
          period2,
          interval: yaInterval,
          includePrePost: false
        },
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.timestamp) {
        throw new Error('No data available for the specified date');
      }

      const timestamps = result.timestamp;
      const ohlcv = result.indicators?.quote?.[0];
      
      if (!ohlcv) {
        throw new Error('Invalid data format from Yahoo Finance');
      }

      const historicalData = timestamps.map((timestamp, index) => ({
        timestamp: new Date(timestamp * 1000).toISOString(),
        open: ohlcv.open?.[index] || 0,
        high: ohlcv.high?.[index] || 0,
        low: ohlcv.low?.[index] || 0,
        close: ohlcv.close?.[index] || 0,
        volume: ohlcv.volume?.[index] || 0,
        interval,
        date
      })).filter(item => item.open > 0); // Filter out invalid entries

      // Cache for 1 hour for historical data
      setTimeout(() => this.cache.delete(cacheKey), 3600000);
      this.cache.set(cacheKey, historicalData);

      return historicalData;
    } catch (error) {
      console.error('Error fetching historical Nifty data:', error.message);
      throw new Error(`Failed to fetch historical data for ${date}`);
    }
  }

  /**
   * Get market status
   */
  getMarketStatus() {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const time = hour * 100 + minute; // HHMM format

    // Weekend
    if (day === 0 || day === 6) {
      return 'CLOSED';
    }

    // Pre-market: 9:00 AM - 9:15 AM
    if (time >= 900 && time < 915) {
      return 'PRE_MARKET';
    }

    // Market hours: 9:15 AM - 3:30 PM
    if (time >= 915 && time <= 1530) {
      return 'OPEN';
    }

    // Post-market: 3:30 PM - 4:00 PM
    if (time > 1530 && time <= 1600) {
      return 'POST_MARKET';
    }

    return 'CLOSED';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new NiftyDataService();