require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nifty-trading',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nifty-trading-test',
  
  // API Configuration
  NSE_API_BASE_URL: process.env.NSE_API_BASE_URL || 'http://nse-api-khaki.vercel.app:5000',
  YAHOO_FINANCE_BASE_URL: process.env.YAHOO_FINANCE_BASE_URL || 'https://query1.finance.yahoo.com',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Cache Configuration
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS) || 60,
  DATA_REFRESH_INTERVAL_MS: parseInt(process.env.DATA_REFRESH_INTERVAL_MS) || 30000,
  
  // Paper Trading Configuration
  INITIAL_BALANCE: parseInt(process.env.INITIAL_BALANCE) || 1000000,
  MAX_POSITIONS: parseInt(process.env.MAX_POSITIONS) || 50,
  
  // Nifty 50 Configuration
  NIFTY_LOT_SIZE: 50, // Standard Nifty lot size
  
  // Expiry Configuration
  DEFAULT_EXPIRY_DAY: 'Tuesday', // Tuesday expiry for Nifty
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

module.exports = config;