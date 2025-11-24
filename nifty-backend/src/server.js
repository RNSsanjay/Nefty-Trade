// src/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Config imports
const database = require('./config/database');
const config = require('./config/config');

// Routes
const niftyRoutes = require('./routes/niftyRoutes');
const optionsRoutes = require('./routes/optionsRoutes');
const paperTradeRoutes = require('./routes/paperTradeRoutes');
const expiryRoutes = require('./routes/expiryRoutes');

// Correct import for named export
const { errorHandler } = require('./middleware/errorHandler');
const { startDataPolling } = require('./services/dataPoller');

class Server {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());

    // CORS configuration for frontend dev
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
      max: config.RATE_LIMIT_MAX_REQUESTS || 200,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use('/api', limiter);
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: database.isConnected ? (database.isConnected() ? 'Connected' : 'Disconnected') : 'Unknown'
      });
    });

    this.app.use('/api/nifty', niftyRoutes);
    this.app.use('/api/options', optionsRoutes);
    this.app.use('/api/papertrade', paperTradeRoutes);
    this.app.use('/api/expiry', expiryRoutes);

    this.app.get('/', (req, res) => {
      res.json({
        message: 'Nifty Trading Backend API',
        version: '1.0.0',
        documentation: '/api-docs'
      });
    });

    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    try {
      if (database.connect) await database.connect();
      if (startDataPolling) startDataPolling();

      const server = this.app.listen(config.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${config.PORT || 5000} in ${config.NODE_ENV || 'development'} mode`);
        console.log(`📊 Health check available at: http://localhost:${config.PORT || 5000}/health`);
      });

      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, shutting down gracefully...');
        server.close(() => {
          if (database.disconnect) database.disconnect();
        });
      });

      return server;
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
