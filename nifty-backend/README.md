# Nifty Trading Backend

A comprehensive Node.js/Express backend for Nifty 50 index and options trading with real-time data feeds and paper trading capabilities.

## 🚀 Features

- **Real-time Data**: Live Nifty 50 index and options data from free APIs
- **Historical Data**: Comprehensive historical data with multiple time intervals
- **Paper Trading**: Virtual trading with unlimited balance and P&L tracking
- **Options Chain**: Complete options data with strike prices and Greeks
- **Risk Management**: Portfolio risk metrics and performance analytics
- **Data Polling**: Automated data collection during market hours
- **Expiry Handling**: Custom Tuesday expiry logic for Nifty options

## 📊 API Endpoints

### Nifty 50 Data
```
GET /api/nifty/live              # Current Nifty 50 data
GET /api/nifty/history           # Historical data with intervals
GET /api/nifty/range             # Data for date range
GET /api/nifty/status            # Market status
```

### Options Data
```
GET /api/options/live            # Live option LTP for specific strike
GET /api/options/chain           # Complete option chain
GET /api/options/history         # Historical option data
GET /api/options/expiries        # Available expiry dates
GET /api/options/strikes         # Available strikes around current price
```

### Paper Trading
```
POST /api/papertrade/orders      # Place virtual order
GET  /api/papertrade/orders      # Get order history
GET  /api/papertrade/portfolio   # Get portfolio and positions
GET  /api/papertrade/pnl         # Detailed P&L and risk metrics
POST /api/papertrade/reset       # Reset portfolio
```

### Expiry Information
```
GET /api/expiry/schedule         # Expiry calendar
GET /api/expiry/next             # Next expiry date
GET /api/expiry/status           # Expiry session status
```

## 🛠️ Installation

1. **Clone and Install Dependencies**
   ```bash
   cd nifty-backend
   npm install
   ```

2. **Set up MongoDB**
   ```bash
   # Install MongoDB or use MongoDB Atlas
   # Default connection: mongodb://localhost:27017/nifty-trading
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/nifty-trading

# APIs
NSE_API_BASE_URL=http://nse-api-khaki.vercel.app:5000
YAHOO_FINANCE_BASE_URL=https://query1.finance.yahoo.com

# Paper Trading
INITIAL_BALANCE=1000000
MAX_POSITIONS=50

# Data Refresh
DATA_REFRESH_INTERVAL_MS=30000
CACHE_TTL_SECONDS=60
```

## 📈 Data Sources

### Primary APIs
- **NSE API**: Real-time Nifty 50 quotes
- **Yahoo Finance**: Historical data and charts
- **Custom Scrapers**: Options chain data

### Market Hours
- **Pre-Market**: 9:00 AM - 9:15 AM IST
- **Regular Session**: 9:15 AM - 3:30 PM IST  
- **Post-Market**: 3:30 PM - 4:00 PM IST

## 🎯 Usage Examples

### Get Live Nifty Data
```bash
curl http://localhost:5000/api/nifty/live
```

### Get Historical Data
```bash
curl "http://localhost:5000/api/nifty/history?date=2023-11-24&interval=15min"
```

### Place Paper Trade Order
```bash
curl -X POST http://localhost:5000/api/papertrade/orders \
  -H "Content-Type: application/json" \
  -d '{
    "strike": 19500,
    "type": "CE",
    "expiry": "2023-11-28",
    "side": "BUY",
    "quantity": 2
  }'
```

### Get Option Chain
```bash
curl "http://localhost:5000/api/options/chain?expiry=2023-11-28"
```

## 🔐 Paper Trading Features

### Order Types
- **Market Orders**: Immediate execution at current price
- **Limit Orders**: Execute at specified price or better
- **Stop Orders**: Execute when price hits stop level

### Position Management
- **Unlimited Balance**: No wallet restrictions for paper trading
- **Real-time P&L**: Live profit/loss calculations
- **Portfolio Analytics**: Risk metrics and performance tracking
- **Greeks Calculation**: Delta, Gamma, Theta, Vega for options

### Risk Metrics
- **Leverage Ratio**: Total exposure vs portfolio value
- **Concentration Risk**: Largest position as % of portfolio
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Largest peak-to-trough decline

## 📊 Database Schema

### Collections
- **niftydatas**: Historical index data
- **optiondatas**: Options historical data  
- **orders**: Paper trade orders
- **portfolios**: Portfolio and positions

### Indexes
- Optimized queries for time-series data
- Compound indexes for efficient lookups
- TTL indexes for data cleanup

## ⚡ Performance

### Caching Strategy
- **In-Memory Cache**: 30-60 second cache for live data
- **Database Cache**: Historical data stored locally
- **Smart Polling**: Market hours only data collection

### Rate Limiting
- **100 requests/15 minutes** per IP
- Graceful error handling
- Fallback to cached data

## 🧪 Testing

```bash
# Run tests
npm test

# API Health Check
curl http://localhost:5000/health
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2023-11-24T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔄 Data Polling Schedule

- **Nifty Data**: Every 1 minute during market hours
- **Options Data**: Every 2 minutes during market hours  
- **P&L Updates**: Every 30 seconds during market hours
- **End of Day Cleanup**: 4:00 PM IST daily

## 🚨 Error Handling

- Comprehensive error logging
- Graceful degradation for API failures
- Automatic retries with exponential backoff
- Circuit breaker pattern for external APIs

## 🔧 Development

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── middleware/      # Express middleware
└── utils/           # Utility functions
```

### Code Standards
- ES6+ JavaScript
- Async/await for promises
- Comprehensive error handling
- JSDoc comments for documentation

## 📞 Support

- **Health Check**: `GET /health`
- **API Status**: `GET /api/nifty/status`
- **Logs**: Check console for detailed logging

## 🔮 Roadmap

- [ ] WebSocket real-time feeds
- [ ] Advanced option strategies
- [ ] Backtesting capabilities  
- [ ] Risk alerts and notifications
- [ ] Performance analytics dashboard
- [ ] Multi-timeframe analysis