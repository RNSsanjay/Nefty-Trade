const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');

class OptionsDataService {
  constructor() {
    this.cache = new Map();
    this.optionChainCache = null;
    this.lastChainFetch = null;
  }

  /**
   * Get live options data for specific strike, type, and expiry
   */
  async getLiveOptionData(strike, type, expiry) {
    try {
      const cacheKey = `option_${strike}_${type}_${expiry}`;
      const now = Date.now();
      
      // Check cache first (30 seconds)
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (now - cached.timestamp < 30000) {
          return cached.data;
        }
      }

      // Get option chain data
      const chainData = await this.getOptionChain();
      
      // Find the specific option
      const optionData = this.findOptionInChain(chainData, strike, type, expiry);
      
      if (!optionData) {
        throw new Error(`Option not found: ${strike} ${type} ${expiry}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: optionData,
        timestamp: now
      });

      return optionData;
    } catch (error) {
      console.error('Error fetching live option data:', error.message);
      throw new Error(`Failed to fetch option data for ${strike} ${type}`);
    }
  }

  /**
   * Get complete option chain for Nifty 50
   */
  async getOptionChain() {
    try {
      const now = Date.now();
      
      // Use cached chain data if available (60 seconds cache)
      if (this.optionChainCache && this.lastChainFetch) {
        if (now - this.lastChainFetch < 60000) {
          return this.optionChainCache;
        }
      }

      // Fetch from NSE API
      const response = await axios.get(`${config.NSE_API_BASE_URL}/option-chain-nifty`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      const chainData = this.parseOptionChain(response.data);
      
      // Cache the chain data
      this.optionChainCache = chainData;
      this.lastChainFetch = now;

      return chainData;
    } catch (error) {
      console.error('Error fetching option chain:', error.message);
      
      // Return cached data if available
      if (this.optionChainCache) {
        return this.optionChainCache;
      }
      
      // Fallback to mock data for development
      return this.generateMockOptionChain();
    }
  }

  /**
   * Parse option chain data from NSE response
   */
  parseOptionChain(rawData) {
    try {
      const options = [];
      const data = rawData.filtered || rawData.records || rawData;
      
      if (!data || !data.data) {
        throw new Error('Invalid option chain data format');
      }

      data.data.forEach(item => {
        const strike = item.strikePrice;
        const expiry = item.expiryDate;
        
        // Call Option (CE)
        if (item.CE) {
          options.push({
            strike,
            type: 'CE',
            expiry: new Date(expiry),
            ltp: parseFloat(item.CE.lastPrice) || 0,
            open: parseFloat(item.CE.openPrice) || 0,
            high: parseFloat(item.CE.dayHigh) || 0,
            low: parseFloat(item.CE.dayLow) || 0,
            close: parseFloat(item.CE.prevClose) || 0,
            volume: parseInt(item.CE.totalTradedVolume) || 0,
            oi: parseInt(item.CE.openInterest) || 0,
            change: parseFloat(item.CE.change) || 0,
            changePercent: parseFloat(item.CE.pChange) || 0,
            iv: parseFloat(item.CE.impliedVolatility) || 0,
            timestamp: new Date().toISOString()
          });
        }

        // Put Option (PE)
        if (item.PE) {
          options.push({
            strike,
            type: 'PE',
            expiry: new Date(expiry),
            ltp: parseFloat(item.PE.lastPrice) || 0,
            open: parseFloat(item.PE.openPrice) || 0,
            high: parseFloat(item.PE.dayHigh) || 0,
            low: parseFloat(item.PE.dayLow) || 0,
            close: parseFloat(item.PE.prevClose) || 0,
            volume: parseInt(item.PE.totalTradedVolume) || 0,
            oi: parseInt(item.PE.openInterest) || 0,
            change: parseFloat(item.PE.change) || 0,
            changePercent: parseFloat(item.PE.pChange) || 0,
            iv: parseFloat(item.PE.impliedVolatility) || 0,
            timestamp: new Date().toISOString()
          });
        }
      });

      return options;
    } catch (error) {
      console.error('Error parsing option chain:', error.message);
      return this.generateMockOptionChain();
    }
  }

  /**
   * Find specific option in chain data
   */
  findOptionInChain(chainData, strike, type, expiry) {
    const expiryDate = new Date(expiry);
    
    return chainData.find(option => 
      option.strike === parseInt(strike) &&
      option.type === type.toUpperCase() &&
      option.expiry.getTime() === expiryDate.getTime()
    );
  }

  /**
   * Generate mock option chain for development
   */
  generateMockOptionChain() {
    const options = [];
    const basePrice = 19500; // Mock Nifty price
    const expiryDates = this.getNextExpiryDates(3);
    
    // Generate strikes around base price
    for (let i = -10; i <= 10; i++) {
      const strike = basePrice + (i * 50);
      
      expiryDates.forEach(expiry => {
        // CE options
        options.push({
          strike,
          type: 'CE',
          expiry,
          ltp: Math.max(1, Math.random() * (basePrice - strike + 100)),
          open: Math.random() * 100 + 50,
          high: Math.random() * 100 + 60,
          low: Math.random() * 100 + 40,
          close: Math.random() * 100 + 50,
          volume: Math.floor(Math.random() * 100000),
          oi: Math.floor(Math.random() * 1000000),
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 10,
          iv: Math.random() * 50 + 10,
          timestamp: new Date().toISOString()
        });

        // PE options
        options.push({
          strike,
          type: 'PE',
          expiry,
          ltp: Math.max(1, Math.random() * (strike - basePrice + 100)),
          open: Math.random() * 100 + 50,
          high: Math.random() * 100 + 60,
          low: Math.random() * 100 + 40,
          close: Math.random() * 100 + 50,
          volume: Math.floor(Math.random() * 100000),
          oi: Math.floor(Math.random() * 1000000),
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 10,
          iv: Math.random() * 50 + 10,
          timestamp: new Date().toISOString()
        });
      });
    }

    return options;
  }

  /**
   * Get next N expiry dates (Tuesdays)
   */
  getNextExpiryDates(count = 3) {
    const dates = [];
    const today = new Date();
    
    // Find next Tuesday
    let nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + (2 - today.getDay() + 7) % 7);
    
    // If today is Tuesday and market hasn't closed, use today
    if (today.getDay() === 2 && today.getHours() < 15) {
      nextTuesday = new Date(today);
    }

    for (let i = 0; i < count; i++) {
      dates.push(new Date(nextTuesday));
      nextTuesday.setDate(nextTuesday.getDate() + 7);
    }

    return dates;
  }

  /**
   * Get historical options data
   */
  async getHistoricalOptionData(strike, type, expiry, date, interval = 'day') {
    try {
      // This would typically fetch from a data provider
      // For now, return mock historical data
      return this.generateMockHistoricalOptions(strike, type, expiry, date, interval);
    } catch (error) {
      console.error('Error fetching historical option data:', error.message);
      throw new Error('Failed to fetch historical option data');
    }
  }

  /**
   * Generate mock historical option data
   */
  generateMockHistoricalOptions(strike, type, expiry, date, interval) {
    const data = [];
    const startDate = new Date(date);
    const intervals = this.getIntervalPoints(startDate, interval);
    
    intervals.forEach(timestamp => {
      data.push({
        strike: parseInt(strike),
        type: type.toUpperCase(),
        expiry: new Date(expiry),
        timestamp,
        ltp: Math.random() * 100 + 10,
        open: Math.random() * 100 + 10,
        high: Math.random() * 100 + 15,
        low: Math.random() * 100 + 5,
        close: Math.random() * 100 + 10,
        volume: Math.floor(Math.random() * 10000),
        oi: Math.floor(Math.random() * 100000),
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        interval,
        date: date
      });
    });

    return data;
  }

  /**
   * Get interval points for historical data
   */
  getIntervalPoints(date, interval) {
    const points = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 15, 0, 0); // Market start
    
    const endOfDay = new Date(date);
    endOfDay.setHours(15, 30, 0, 0); // Market end

    let current = new Date(startOfDay);
    const intervalMinutes = this.getIntervalMinutes(interval);

    while (current <= endOfDay) {
      points.push(new Date(current));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    return points;
  }

  /**
   * Convert interval string to minutes
   */
  getIntervalMinutes(interval) {
    const mapping = {
      '1min': 1,
      '5min': 5,
      '15min': 15,
      '30min': 30,
      '1h': 60,
      'day': 375 // Market hours
    };
    
    return mapping[interval] || 375;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.optionChainCache = null;
    this.lastChainFetch = null;
  }
}

module.exports = new OptionsDataService();