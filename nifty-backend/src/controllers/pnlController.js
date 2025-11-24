const { asyncHandler } = require('../middleware/errorHandler');
const { Portfolio, Order } = require('../models/PaperTrade');
const { 
  calculatePortfolioPnL, 
  calculateRiskMetrics,
  calculateGreeks
} = require('../utils/pnlCalculator');
const niftyDataService = require('../services/niftyDataService');

/**
 * @desc    Get detailed P&L calculations
 * @route   GET /api/papertrade/pnl
 * @access  Public
 */
const getDetailedPnL = asyncHandler(async (req, res) => {
  const { sessionId = 'default', includeGreeks = false } = req.query;

  try {
    // Get portfolio
    const portfolio = await Portfolio.findOne({ sessionId });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio not found'
      });
    }

    // Get current market data
    const niftyData = await niftyDataService.getLiveData();
    const spotPrice = niftyData.ltp;

    // Calculate comprehensive P&L
    const pnlSummary = calculatePortfolioPnL(portfolio.positions);
    
    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(portfolio.positions, portfolio.balance + portfolio.totalPnl);

    // Add Greeks if requested
    let positionsWithGreeks = portfolio.positions;
    if (includeGreeks === 'true') {
      positionsWithGreeks = portfolio.positions.map(position => {
        if (position.type && ['CE', 'PE'].includes(position.type)) {
          const greeks = calculateGreeks(position, spotPrice);
          return { ...position.toObject(), greeks };
        }
        return position;
      });
    }

    // Get recent orders for performance analysis
    const recentOrders = await Order.find({ sessionId })
      .sort({ orderTime: -1 })
      .limit(10);

    // Calculate session statistics
    const sessionStats = {
      totalTrades: recentOrders.length,
      successfulTrades: recentOrders.filter(order => order.pnl > 0).length,
      winRate: recentOrders.length > 0 ? 
        (recentOrders.filter(order => order.pnl > 0).length / recentOrders.length) * 100 : 0,
      averageTradeValue: recentOrders.length > 0 ? 
        recentOrders.reduce((sum, order) => sum + order.totalValue, 0) / recentOrders.length : 0,
      largestWin: recentOrders.length > 0 ? Math.max(...recentOrders.map(order => order.pnl || 0)) : 0,
      largestLoss: recentOrders.length > 0 ? Math.min(...recentOrders.map(order => order.pnl || 0)) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        portfolio: {
          sessionId: portfolio.sessionId,
          initialBalance: 1000000, // From config
          currentBalance: portfolio.balance,
          totalValue: portfolio.balance + portfolio.totalPnl,
          totalPnl: portfolio.totalPnl,
          dayPnl: portfolio.dayPnl,
          lastUpdated: portfolio.lastUpdated
        },
        pnlSummary,
        riskMetrics,
        positions: positionsWithGreeks,
        marketData: {
          spotPrice,
          change: niftyData.change,
          changePercent: niftyData.changePercent,
          marketStatus: niftyDataService.getMarketStatus(),
          timestamp: niftyData.timestamp
        },
        sessionStats,
        performance: {
          totalReturn: portfolio.totalPnl,
          totalReturnPercent: (portfolio.totalPnl / 1000000) * 100,
          sharpeRatio: this.calculateSharpeRatio(recentOrders),
          maxDrawdown: this.calculateMaxDrawdown(recentOrders),
          profitFactor: this.calculateProfitFactor(recentOrders)
        }
      }
    });

  } catch (error) {
    console.error('Error in getDetailedPnL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate P&L'
    });
  }
});

/**
 * Calculate Sharpe ratio (simplified)
 */
function calculateSharpeRatio(orders) {
  if (orders.length < 2) return 0;
  
  const returns = orders.map(order => order.pnl || 0);
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev !== 0 ? Math.round((avgReturn / stdDev) * 100) / 100 : 0;
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(orders) {
  if (orders.length === 0) return 0;
  
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;
  
  // Process orders in chronological order
  const sortedOrders = [...orders].sort((a, b) => a.orderTime - b.orderTime);
  
  for (const order of sortedOrders) {
    runningPnL += order.pnl || 0;
    peak = Math.max(peak, runningPnL);
    const drawdown = peak - runningPnL;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return Math.round(maxDrawdown * 100) / 100;
}

/**
 * Calculate profit factor
 */
function calculateProfitFactor(orders) {
  const profits = orders.filter(order => (order.pnl || 0) > 0);
  const losses = orders.filter(order => (order.pnl || 0) < 0);
  
  const totalProfits = profits.reduce((sum, order) => sum + order.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((sum, order) => sum + order.pnl, 0));
  
  return totalLosses !== 0 ? Math.round((totalProfits / totalLosses) * 100) / 100 : 0;
}

module.exports = {
  getDetailedPnL
};