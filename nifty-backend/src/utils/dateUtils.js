/**
 * Date and time utilities for IST timezone
 */

/**
 * Get current IST time
 */
function getCurrentISTTime() {
  const now = new Date();
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
}

/**
 * Convert UTC to IST
 */
function convertToIST(utcDate) {
  const date = new Date(utcDate);
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
}

/**
 * Format date for display (DD/MM/YYYY)
 */
function formatDateForDisplay(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN');
}

/**
 * Format date for API (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get market hours status
 */
function getMarketHoursStatus() {
  const ist = getCurrentISTTime();
  const day = ist.getDay(); // 0 = Sunday
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  const time = hour * 100 + minute; // HHMM format

  // Weekend
  if (day === 0 || day === 6) {
    return { status: 'CLOSED', reason: 'Weekend' };
  }

  // Pre-market
  if (time >= 900 && time < 915) {
    return { status: 'PRE_MARKET', reason: 'Pre-market session' };
  }

  // Market open
  if (time >= 915 && time <= 1530) {
    return { status: 'OPEN', reason: 'Regular trading session' };
  }

  // Post-market
  if (time > 1530 && time <= 1600) {
    return { status: 'POST_MARKET', reason: 'Post-market session' };
  }

  // Closed
  return { status: 'CLOSED', reason: 'Outside trading hours' };
}

/**
 * Get next trading day
 */
function getNextTradingDay(date = new Date()) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Get previous trading day
 */
function getPreviousTradingDay(date = new Date()) {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  
  // Skip weekends
  while (prevDay.getDay() === 0 || prevDay.getDay() === 6) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
}

/**
 * Get next Tuesday (expiry day)
 */
function getNextTuesday(date = new Date()) {
  const tuesday = new Date(date);
  const daysUntilTuesday = (2 - date.getDay() + 7) % 7;
  tuesday.setDate(date.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
  return tuesday;
}

/**
 * Check if date is a trading day
 */
function isTradingDay(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day >= 1 && day <= 5; // Monday to Friday
}

/**
 * Get time until market open/close
 */
function getTimeUntilMarketEvent() {
  const ist = getCurrentISTTime();
  const marketStatus = getMarketHoursStatus();
  
  if (marketStatus.status === 'CLOSED') {
    // Calculate time until next market open
    let nextOpen = new Date(ist);
    nextOpen.setHours(9, 15, 0, 0);
    
    // If already past 9:15 today, go to next trading day
    if (ist.getHours() > 9 || (ist.getHours() === 9 && ist.getMinutes() >= 15)) {
      nextOpen = getNextTradingDay(ist);
      nextOpen.setHours(9, 15, 0, 0);
    }
    
    const timeUntil = nextOpen - ist;
    return {
      event: 'MARKET_OPEN',
      timeUntil: timeUntil,
      nextEvent: nextOpen,
      formatted: formatTimeUntil(timeUntil)
    };
  } else if (marketStatus.status === 'OPEN') {
    // Calculate time until market close
    const marketClose = new Date(ist);
    marketClose.setHours(15, 30, 0, 0);
    
    const timeUntil = marketClose - ist;
    return {
      event: 'MARKET_CLOSE',
      timeUntil: timeUntil,
      nextEvent: marketClose,
      formatted: formatTimeUntil(timeUntil)
    };
  }
  
  return null;
}

/**
 * Format milliseconds to human readable time
 */
function formatTimeUntil(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get trading calendar for month
 */
function getTradingCalendar(year, month) {
  const calendar = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isTrading = isTradingDay(date);
    const isExpiry = date.getDay() === 2; // Tuesday
    
    calendar.push({
      date: formatDateForAPI(date),
      day: date.getDate(),
      dayOfWeek: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      isTrading,
      isExpiry: isTrading && isExpiry,
      isToday: formatDateForAPI(date) === formatDateForAPI(new Date())
    });
  }
  
  return calendar;
}

module.exports = {
  getCurrentISTTime,
  convertToIST,
  formatDateForDisplay,
  formatDateForAPI,
  getMarketHoursStatus,
  getNextTradingDay,
  getPreviousTradingDay,
  getNextTuesday,
  isTradingDay,
  getTimeUntilMarketEvent,
  formatTimeUntil,
  getTradingCalendar
};