const cron = require('node-cron');
const niftyDataService = require('./niftyDataService');
const optionsDataService = require('./optionsDataService');
const NiftyData = require('../models/NiftyData');
const OptionData = require('../models/OptionData');
const { Portfolio } = require('../models/PaperTrade');
const config = require('../config/config');

class DataPollingService {
  constructor() {
    this.isPolling = false;
    this.niftyPollingJob = null;
    this.optionsPollingJob = null;
    this.pnlUpdateJob = null;
  }

  /**
   * Start all polling services
   */
  start() {
    if (this.isPolling) {
      console.log('⚠️  Data polling is already running');
      return;
    }

    console.log('🔄 Starting data polling services...');
    
    this.startNiftyPolling();
    this.startOptionsPolling();
    this.startPnLUpdates();
    
    this.isPolling = true;
    console.log('✅ Data polling services started successfully');
  }

  /**
   * Stop all polling services
   */
  stop() {
    if (!this.isPolling) {
      console.log('⚠️  Data polling is not running');
      return;
    }

    console.log('🛑 Stopping data polling services...');
    
    if (this.niftyPollingJob) {
      this.niftyPollingJob.destroy();
    }
    
    if (this.optionsPollingJob) {
      this.optionsPollingJob.destroy();
    }
    
    if (this.pnlUpdateJob) {
      this.pnlUpdateJob.destroy();
    }
    
    this.isPolling = false;
    console.log('✅ Data polling services stopped successfully');
  }

  /**
   * Start Nifty data polling
   */
  startNiftyPolling() {
    // Poll Nifty data every minute during market hours
    this.niftyPollingJob = cron.schedule('* 9-15 * * 1-5', async () => {
      try {
        const marketStatus = niftyDataService.getMarketStatus();
        
        if (marketStatus !== 'OPEN') {
          return; // Skip if market is not open
        }

        console.log('📊 Polling Nifty data...');
        const liveData = await niftyDataService.getLiveData();
        
        // Save to database with 1-minute interval
        const niftyRecord = new NiftyData({
          symbol: 'NIFTY 50',
          timestamp: new Date(),
          open: liveData.open,
          high: liveData.high,
          low: liveData.low,
          close: liveData.ltp, // Use LTP as close for intraday
          ltp: liveData.ltp,
          change: liveData.change,
          changePercent: liveData.changePercent,
          volume: liveData.volume,
          interval: '1min',
          date: new Date().toISOString().split('T')[0]
        });

        await niftyRecord.save().catch(err => {
          if (err.code !== 11000) { // Ignore duplicate key errors
            console.error('Error saving Nifty data:', err.message);
          }
        });

        console.log(`💾 Nifty data saved: ${liveData.ltp} (${liveData.changePercent.toFixed(2)}%)`);
        
      } catch (error) {
        console.error('❌ Error polling Nifty data:', error.message);
      }
    }, {
      timezone: "Asia/Kolkata"
    });
  }

  /**
   * Start Options data polling
   */
  startOptionsPolling() {
    // Poll options data every 2 minutes during market hours
    this.optionsPollingJob = cron.schedule('*/2 9-15 * * 1-5', async () => {
      try {
        const marketStatus = niftyDataService.getMarketStatus();
        
        if (marketStatus !== 'OPEN') {
          return;
        }

        console.log('📈 Polling Options data...');
        const optionChain = await optionsDataService.getOptionChain();
        
        if (optionChain && optionChain.length > 0) {
          // Save options data to database
          const optionRecords = optionChain.map(option => ({
            strike: option.strike,
            type: option.type,
            expiry: option.expiry,
            timestamp: new Date(),
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
            interval: '2min',
            date: new Date().toISOString().split('T')[0]
          }));

          // Insert in batches to avoid overwhelming the database
          const batchSize = 50;
          for (let i = 0; i < optionRecords.length; i += batchSize) {
            const batch = optionRecords.slice(i, i + batchSize);
            await OptionData.insertMany(batch, { ordered: false }).catch(err => {
              if (err.code !== 11000) {
                console.error('Error saving options batch:', err.message);
              }
            });
          }

          console.log(`💾 Options data saved: ${optionRecords.length} records`);
        }
        
      } catch (error) {
        console.error('❌ Error polling Options data:', error.message);
      }
    }, {
      timezone: "Asia/Kolkata"
    });
  }

  /**
   * Start P&L updates for all portfolios
   */
  startPnLUpdates() {
    // Update P&L every 30 seconds during market hours
    this.pnlUpdateJob = cron.schedule('*/30 9-15 * * 1-5', async () => {
      try {
        const marketStatus = niftyDataService.getMarketStatus();
        
        if (marketStatus !== 'OPEN') {
          return;
        }

        console.log('💰 Updating portfolio P&L...');
        await this.updateAllPortfolios();
        
      } catch (error) {
        console.error('❌ Error updating P&L:', error.message);
      }
    }, {
      timezone: "Asia/Kolkata"
    });
  }

  /**
   * Update P&L for all portfolios
   */
  async updateAllPortfolios() {
    try {
      const portfolios = await Portfolio.find({});
      let updatedCount = 0;

      for (const portfolio of portfolios) {
        if (portfolio.positions.length === 0) {
          continue;
        }

        let totalPnl = 0;
        let hasUpdates = false;

        for (const position of portfolio.positions) {
          try {
            let currentPrice;

            if (position.type && ['CE', 'PE'].includes(position.type)) {
              // Get current option price
              const optionData = await optionsDataService.getLiveOptionData(
                position.strike,
                position.type,
                position.expiry
              );
              currentPrice = optionData.ltp;
            } else {
              // Get current Nifty price
              const niftyData = await niftyDataService.getLiveData();
              currentPrice = niftyData.ltp;
            }

            if (currentPrice && currentPrice !== position.currentPrice) {
              position.currentPrice = currentPrice;
              const priceDiff = currentPrice - position.avgPrice;
              position.pnl = priceDiff * position.quantity * config.NIFTY_LOT_SIZE;
              position.pnlPercent = (priceDiff / position.avgPrice) * 100;
              totalPnl += position.pnl;
              hasUpdates = true;
            }

          } catch (error) {
            console.error(`Error updating position ${position.orderId}:`, error.message);
          }
        }

        if (hasUpdates) {
          portfolio.totalPnl = totalPnl;
          portfolio.lastUpdated = new Date();
          await portfolio.save();
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        console.log(`💾 Updated P&L for ${updatedCount} portfolios`);
      }

    } catch (error) {
      console.error('Error in updateAllPortfolios:', error.message);
    }
  }

  /**
   * Perform end-of-day cleanup
   */
  async endOfDayCleanup() {
    try {
      console.log('🧹 Performing end-of-day cleanup...');
      
      // Clear data service caches
      niftyDataService.clearCache();
      optionsDataService.clearCache();
      
      // Reset day P&L for all portfolios
      await Portfolio.updateMany({}, { dayPnl: 0 });
      
      console.log('✅ End-of-day cleanup completed');
      
    } catch (error) {
      console.error('❌ Error in end-of-day cleanup:', error.message);
    }
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      services: {
        niftyPolling: this.niftyPollingJob ? 'active' : 'inactive',
        optionsPolling: this.optionsPollingJob ? 'active' : 'inactive',
        pnlUpdates: this.pnlUpdateJob ? 'active' : 'inactive'
      },
      marketStatus: niftyDataService.getMarketStatus(),
      lastUpdate: new Date().toISOString()
    };
  }
}

// Create singleton instance
const dataPollingService = new DataPollingService();

// Schedule end-of-day cleanup at 4:00 PM IST
cron.schedule('0 16 * * 1-5', () => {
  dataPollingService.endOfDayCleanup();
}, {
  timezone: "Asia/Kolkata"
});

// Export functions for use in server.js
module.exports = {
  startDataPolling: () => dataPollingService.start(),
  stopDataPolling: () => dataPollingService.stop(),
  getPollingStatus: () => dataPollingService.getStatus(),
  dataPollingService
};