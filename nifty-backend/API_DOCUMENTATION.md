# Nifty Trading Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
This API currently does not require authentication. All endpoints are publicly accessible.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2023-11-24T10:30:00.000Z",
  "count": 10 // Optional: for paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE" // Optional
}
```

---

# Nifty 50 Endpoints

## Get Live Nifty Data
Get real-time Nifty 50 index data.

**GET** `/nifty/live`

### Response
```json
{
  "success": true,
  "data": {
    "symbol": "NIFTY 50",
    "ltp": 19485.50,
    "open": 19420.25,
    "high": 19510.80,
    "low": 19380.15,
    "close": 19475.30,
    "change": 10.20,
    "changePercent": 0.52,
    "volume": 1234567,
    "timestamp": "2023-11-24T10:30:00.000Z",
    "marketStatus": "OPEN"
  }
}
```

## Get Historical Nifty Data
Get historical Nifty data for specific date and interval.

**GET** `/nifty/history`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Date in YYYY-MM-DD format |
| interval | string | No | Time interval (1min, 5min, 15min, 30min, 1h, day) |

### Example Request
```
GET /nifty/history?date=2023-11-24&interval=15min
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2023-11-24T09:15:00.000Z",
      "open": 19420.25,
      "high": 19445.80,
      "low": 19410.15,
      "close": 19435.50,
      "volume": 125000,
      "interval": "15min"
    }
  ],
  "count": 25,
  "source": "api"
}
```

## Get Market Status
Get current market status and trading hours.

**GET** `/nifty/status`

### Response
```json
{
  "success": true,
  "data": {
    "status": "OPEN",
    "timestamp": "2023-11-24T10:30:00.000Z",
    "timezone": "Asia/Kolkata"
  }
}
```

---

# Options Endpoints

## Get Live Option Data
Get real-time LTP for specific option strike.

**GET** `/options/live`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| strike | number | Yes | Strike price |
| type | string | Yes | Option type (CE/PE) |
| expiry | string | Yes | Expiry date (YYYY-MM-DD) |

### Example Request
```
GET /options/live?strike=19500&type=CE&expiry=2023-11-28
```

### Response
```json
{
  "success": true,
  "data": {
    "strike": 19500,
    "type": "CE",
    "expiry": "2023-11-28T00:00:00.000Z",
    "ltp": 125.50,
    "open": 118.75,
    "high": 135.25,
    "low": 115.50,
    "close": 122.30,
    "volume": 45678,
    "oi": 987654,
    "change": 3.20,
    "changePercent": 2.61,
    "iv": 18.45,
    "timestamp": "2023-11-24T10:30:00.000Z"
  }
}
```

## Get Option Chain
Get complete option chain data.

**GET** `/options/chain`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| expiry | string | No | Filter by expiry date |

### Response
```json
{
  "success": true,
  "data": [
    {
      "strike": 19400,
      "CE": {
        "ltp": 185.25,
        "volume": 12345,
        "oi": 567890,
        "change": 5.75,
        "changePercent": 3.21
      },
      "PE": {
        "ltp": 45.80,
        "volume": 9876,
        "oi": 432109,
        "change": -2.10,
        "changePercent": -4.38
      }
    }
  ],
  "count": 21
}
```

## Get Available Expiries
Get list of available option expiry dates.

**GET** `/options/expiries`

### Response
```json
{
  "success": true,
  "data": [
    {
      "date": "2023-11-28",
      "formatted": "Tue, 28 Nov 2023",
      "daysToExpiry": 4
    },
    {
      "date": "2023-12-05", 
      "formatted": "Tue, 05 Dec 2023",
      "daysToExpiry": 11
    }
  ],
  "count": 6
}
```

## Get Available Strikes
Get strike prices around current Nifty price.

**GET** `/options/strikes`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| range | number | No | Number of strikes above/below current price (default: 10) |

### Response
```json
{
  "success": true,
  "data": {
    "currentPrice": 19485.50,
    "atm": 19500,
    "strikes": [
      {
        "strike": 19300,
        "moneyness": "ITM",
        "distance": 185.50
      },
      {
        "strike": 19500,
        "moneyness": "ATM", 
        "distance": 14.50
      },
      {
        "strike": 19700,
        "moneyness": "OTM",
        "distance": 214.50
      }
    ]
  }
}
```

---

# Paper Trading Endpoints

## Place Order
Place a virtual trading order.

**POST** `/papertrade/orders`

### Request Body
```json
{
  "symbol": "NIFTY",
  "strike": 19500,
  "type": "CE",
  "expiry": "2023-11-28",
  "side": "BUY",
  "quantity": 2,
  "orderType": "MARKET",
  "sessionId": "user123"
}
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| side | string | Yes | BUY or SELL |
| quantity | number | Yes | Number of lots |
| symbol | string | No | Default: NIFTY |
| strike | number | No | Required for options |
| type | string | No | CE/PE for options, INDEX for Nifty |
| expiry | string | No | Required for options |
| orderType | string | No | MARKET, LIMIT (default: MARKET) |
| limitPrice | number | No | For limit orders |
| sessionId | string | No | Default: 'default' |

### Response
```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "ORD_1700826000123_abc45",
      "symbol": "NIFTY",
      "strike": 19500,
      "type": "CE",
      "side": "BUY",
      "quantity": 2,
      "entryPrice": 125.50,
      "totalValue": 12550,
      "status": "FILLED",
      "orderTime": "2023-11-24T10:30:00.000Z"
    },
    "portfolio": {
      "balance": 987450,
      "totalPositions": 1
    }
  }
}
```

## Get Orders
Get order history and status.

**GET** `/papertrade/orders`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | No | Default: 'default' |
| status | string | No | Filter by status |
| limit | number | No | Number of orders (default: 50) |
| offset | number | No | Skip orders (default: 0) |

### Response
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD_1700826000123_abc45",
      "symbol": "NIFTY",
      "strike": 19500,
      "type": "CE",
      "side": "BUY",
      "quantity": 2,
      "entryPrice": 125.50,
      "currentPrice": 130.25,
      "pnl": 475,
      "pnlPercent": 3.78,
      "status": "FILLED",
      "orderTime": "2023-11-24T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

## Get Portfolio
Get current portfolio and positions.

**GET** `/papertrade/portfolio`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | No | Default: 'default' |

### Response
```json
{
  "success": true,
  "data": {
    "sessionId": "default",
    "balance": 987450,
    "totalValue": 987925,
    "totalPnl": 475,
    "dayPnl": 475,
    "positions": [
      {
        "orderId": "ORD_1700826000123_abc45",
        "symbol": "NIFTY",
        "strike": 19500,
        "type": "CE",
        "quantity": 2,
        "avgPrice": 125.50,
        "currentPrice": 130.25,
        "pnl": 475,
        "pnlPercent": 3.78
      }
    ],
    "summary": {
      "totalPositions": 1,
      "profitablePositions": 1,
      "losingPositions": 0,
      "maxProfit": 475,
      "maxLoss": 0
    }
  }
}
```

## Get Detailed P&L
Get comprehensive P&L analysis with risk metrics.

**GET** `/papertrade/pnl`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | No | Default: 'default' |
| includeGreeks | boolean | No | Include option Greeks |

### Response
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "sessionId": "default",
      "initialBalance": 1000000,
      "currentBalance": 987450,
      "totalValue": 987925,
      "totalPnl": 475
    },
    "pnlSummary": {
      "totalPnl": 475,
      "totalPnlPercent": 0.048,
      "profitablePositions": 1,
      "losingPositions": 0,
      "maxProfit": 475,
      "maxLoss": 0
    },
    "riskMetrics": {
      "totalExposure": 12550,
      "leverageRatio": 0.013,
      "concentrationRisk": 1.0,
      "riskLevel": "LOW"
    },
    "marketData": {
      "spotPrice": 19485.50,
      "change": 10.20,
      "changePercent": 0.52,
      "marketStatus": "OPEN"
    },
    "performance": {
      "totalReturn": 475,
      "totalReturnPercent": 0.0475,
      "sharpeRatio": 0.85,
      "maxDrawdown": 0,
      "profitFactor": null
    }
  }
}
```

## Reset Portfolio
Reset portfolio to initial state.

**POST** `/papertrade/reset`

### Request Body
```json
{
  "sessionId": "default"
}
```

### Response
```json
{
  "success": true,
  "message": "Portfolio reset successfully",
  "data": {
    "sessionId": "default",
    "balance": 1000000,
    "totalPnl": 0,
    "positions": []
  }
}
```

---

# Expiry Endpoints

## Get Expiry Schedule
Get expiry calendar for a specific month.

**GET** `/expiry/schedule`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | number | No | Year (default: current year) |
| month | number | No | Month 1-12 (default: current month) |

### Response
```json
{
  "success": true,
  "data": {
    "year": 2023,
    "month": 11,
    "monthName": "November",
    "expiries": [
      {
        "date": "2023-11-07",
        "formatted": "Tuesday, 7 November 2023",
        "isExpired": true,
        "daysToExpiry": 0
      },
      {
        "date": "2023-11-28",
        "formatted": "Tuesday, 28 November 2023", 
        "isExpired": false,
        "daysToExpiry": 4
      }
    ],
    "currentExpiry": {
      "date": "2023-11-28",
      "isExpired": false
    },
    "totalExpiries": 4
  }
}
```

## Get Next Expiry
Get next available expiry date.

**GET** `/expiry/next`

### Response
```json
{
  "success": true,
  "data": {
    "current": {
      "date": "2023-11-28",
      "formatted": "Tuesday, 28 November 2023",
      "daysToExpiry": 4,
      "isToday": false
    },
    "next": {
      "date": "2023-12-05",
      "formatted": "Tuesday, 5 December 2023",
      "daysToExpiry": 11
    }
  }
}
```

## Get Expiry Status
Check if current session is expiry day.

**GET** `/expiry/status`

### Response
```json
{
  "success": true,
  "data": {
    "isExpiryDay": true,
    "isExpirySession": false,
    "isPreExpirySession": true,
    "status": "PRE_EXPIRY",
    "currentTime": "2023-11-28T14:30:00.000Z",
    "timezone": "Asia/Kolkata",
    "message": "Approaching expiry session - increased volatility expected"
  }
}
```

---

# Error Codes

| Code | Description |
|------|-------------|
| INVALID_DATE | Date format is invalid |
| INVALID_INTERVAL | Time interval not supported |
| INVALID_STRIKE | Strike price is invalid |
| INVALID_TYPE | Option type must be CE or PE |
| INVALID_SIDE | Order side must be BUY or SELL |
| INSUFFICIENT_BALANCE | Not enough balance for order |
| OPTION_NOT_FOUND | Specified option not available |
| PORTFOLIO_NOT_FOUND | Portfolio session not found |
| MARKET_CLOSED | Market is currently closed |
| API_ERROR | External API error |
| DATABASE_ERROR | Database operation failed |

---

# Rate Limits

- **100 requests per 15 minutes** per IP address
- Health check endpoint is not rate limited
- Rate limit headers included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1700826000
  ```

---

# Market Hours (IST)

- **Pre-Market**: 9:00 AM - 9:15 AM
- **Regular Session**: 9:15 AM - 3:30 PM
- **Post-Market**: 3:30 PM - 4:00 PM
- **Weekend**: Saturday and Sunday (Closed)

---

# WebSocket Events (Future)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:5000/ws');

// Subscribe to live data
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'nifty_live'
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live update:', data);
};
```

---

# SDKs and Integration

## JavaScript/Node.js
```javascript
const axios = require('axios');

class NiftyAPI {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  async getNiftyLive() {
    const response = await axios.get(`${this.baseURL}/nifty/live`);
    return response.data;
  }

  async placeOrder(order) {
    const response = await axios.post(`${this.baseURL}/papertrade/orders`, order);
    return response.data;
  }
}

const api = new NiftyAPI();
```

## Python
```python
import requests

class NiftyAPI:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
    
    def get_nifty_live(self):
        response = requests.get(f"{self.base_url}/nifty/live")
        return response.json()
    
    def place_order(self, order):
        response = requests.post(f"{self.base_url}/papertrade/orders", json=order)
        return response.json()

api = NiftyAPI()
```