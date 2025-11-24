const config = require('../config/config');

/**
 * Calculate P&L for a position
 */
function calculatePositionPnL(position, currentPrice) {
  if (!currentPrice || !position.avgPrice) {
    return {
      pnl: 0,
      pnlPercent: 0,
      pnlPoints: 0
    };
  }

  const priceDiff = currentPrice - position.avgPrice;
  const pnlPoints = priceDiff;
  const pnl = priceDiff * position.quantity * config.NIFTY_LOT_SIZE;
  const pnlPercent = (priceDiff / position.avgPrice) * 100;

  return {
    pnl: Math.round(pnl * 100) / 100, // Round to 2 decimal places
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    pnlPoints: Math.round(pnlPoints * 100) / 100
  };
}

/**
 * Calculate portfolio-level P&L
 */
function calculatePortfolioPnL(positions) {
  const summary = {
    totalPnl: 0,
    totalPnlPercent: 0,
    totalInvested: 0,
    currentValue: 0,
    profitablePositions: 0,
    losingPositions: 0,
    maxProfit: 0,
    maxLoss: 0,
    positions: []
  };

  if (!positions || positions.length === 0) {
    return summary;
  }

  for (const position of positions) {
    const invested = position.avgPrice * position.quantity * config.NIFTY_LOT_SIZE;
    const currentVal = (position.currentPrice || position.avgPrice) * position.quantity * config.NIFTY_LOT_SIZE;
    
    summary.totalInvested += invested;
    summary.currentValue += currentVal;
    summary.totalPnl += position.pnl || 0;

    if ((position.pnl || 0) > 0) {
      summary.profitablePositions++;
    } else if ((position.pnl || 0) < 0) {
      summary.losingPositions++;
    }

    summary.maxProfit = Math.max(summary.maxProfit, position.pnl || 0);
    summary.maxLoss = Math.min(summary.maxLoss, position.pnl || 0);

    // Enhanced position info
    summary.positions.push({
      ...position,
      invested,
      currentValue: currentVal,
      pnlPercent: invested > 0 ? ((currentVal - invested) / invested) * 100 : 0
    });
  }

  // Calculate overall percentage
  summary.totalPnlPercent = summary.totalInvested > 0 
    ? (summary.totalPnl / summary.totalInvested) * 100 
    : 0;

  // Round values
  summary.totalPnl = Math.round(summary.totalPnl * 100) / 100;
  summary.totalPnlPercent = Math.round(summary.totalPnlPercent * 100) / 100;
  summary.totalInvested = Math.round(summary.totalInvested * 100) / 100;
  summary.currentValue = Math.round(summary.currentValue * 100) / 100;

  return summary;
}

/**
 * Calculate option strategy P&L (for complex strategies like straddle, strangle, etc.)
 */
function calculateStrategyPnL(legs, spotPrice) {
  if (!legs || legs.length === 0) {
    return {
      totalPnl: 0,
      breakevens: [],
      maxProfit: null,
      maxLoss: null,
      legs: []
    };
  }

  const legPnL = legs.map(leg => {
    const { strike, type, side, quantity, entryPrice, currentPrice } = leg;
    
    let intrinsicValue = 0;
    if (type === 'CE') {
      intrinsicValue = Math.max(0, spotPrice - strike);
    } else if (type === 'PE') {
      intrinsicValue = Math.max(0, strike - spotPrice);
    }

    const multiplier = side === 'BUY' ? 1 : -1;
    const premiumPnL = (currentPrice - entryPrice) * quantity * config.NIFTY_LOT_SIZE * multiplier;
    
    return {
      ...leg,
      intrinsicValue,
      premiumPnL,
      totalPnL: premiumPnL
    };
  });

  const totalPnl = legPnL.reduce((sum, leg) => sum + leg.totalPnL, 0);

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    legs: legPnL,
    spotPrice
  };
}

/**
 * Calculate Greeks for option positions
 */
function calculateGreeks(position, spotPrice, volatility = 0.2, riskFreeRate = 0.06) {
  const { strike, type, expiry, currentPrice } = position;
  
  if (!strike || !type || !expiry || !currentPrice) {
    return {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }

  const timeToExpiry = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24 * 365);
  
  if (timeToExpiry <= 0) {
    return {
      delta: type === 'CE' ? (spotPrice > strike ? 1 : 0) : (spotPrice < strike ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0
    };
  }

  // Simplified Black-Scholes Greeks approximation
  const d1 = (Math.log(spotPrice / strike) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / 
             (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

  // Standard normal cumulative distribution
  const N = (x) => 0.5 * (1 + erf(x / Math.sqrt(2)));
  const n = (x) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

  let delta, gamma, theta, vega, rho;

  if (type === 'CE') {
    delta = N(d1);
    theta = -(spotPrice * n(d1) * volatility) / (2 * Math.sqrt(timeToExpiry)) - 
            riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);
    rho = strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);
  } else {
    delta = N(d1) - 1;
    theta = -(spotPrice * n(d1) * volatility) / (2 * Math.sqrt(timeToExpiry)) + 
            riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2);
    rho = -strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2);
  }

  gamma = n(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry));
  vega = spotPrice * n(d1) * Math.sqrt(timeToExpiry);

  return {
    delta: Math.round(delta * 10000) / 10000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    rho: Math.round(rho * 100) / 100
  };
}

// Error function approximation for normal distribution
function erf(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Generate risk metrics for portfolio
 */
function calculateRiskMetrics(positions, portfolioValue) {
  const metrics = {
    totalExposure: 0,
    leverageRatio: 0,
    concentrationRisk: 0,
    maxPositionSize: 0,
    diversificationScore: 0,
    riskLevel: 'LOW'
  };

  if (!positions || positions.length === 0) {
    return metrics;
  }

  // Calculate exposures
  const exposures = positions.map(position => {
    const exposure = (position.currentPrice || position.avgPrice) * position.quantity * config.NIFTY_LOT_SIZE;
    return {
      ...position,
      exposure
    };
  });

  metrics.totalExposure = exposures.reduce((sum, pos) => sum + pos.exposure, 0);
  metrics.leverageRatio = portfolioValue > 0 ? metrics.totalExposure / portfolioValue : 0;
  metrics.maxPositionSize = Math.max(...exposures.map(pos => pos.exposure));
  metrics.concentrationRisk = metrics.totalExposure > 0 ? metrics.maxPositionSize / metrics.totalExposure : 0;

  // Simple diversification score based on number of different strikes/types
  const uniquePositions = new Set(
    positions.map(pos => `${pos.strike}_${pos.type}_${pos.expiry}`)
  );
  metrics.diversificationScore = Math.min(uniquePositions.size / 10, 1); // Score out of 1

  // Risk level assessment
  if (metrics.leverageRatio > 3 || metrics.concentrationRisk > 0.5) {
    metrics.riskLevel = 'HIGH';
  } else if (metrics.leverageRatio > 2 || metrics.concentrationRisk > 0.3) {
    metrics.riskLevel = 'MEDIUM';
  } else {
    metrics.riskLevel = 'LOW';
  }

  // Round values
  metrics.totalExposure = Math.round(metrics.totalExposure * 100) / 100;
  metrics.leverageRatio = Math.round(metrics.leverageRatio * 100) / 100;
  metrics.concentrationRisk = Math.round(metrics.concentrationRisk * 100) / 100;
  metrics.diversificationScore = Math.round(metrics.diversificationScore * 100) / 100;

  return metrics;
}

module.exports = {
  calculatePositionPnL,
  calculatePortfolioPnL,
  calculateStrategyPnL,
  calculateGreeks,
  calculateRiskMetrics
};