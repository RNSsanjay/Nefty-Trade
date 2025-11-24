/**
 * Validation utilities for API requests
 */

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate time interval
 */
function isValidInterval(interval) {
  const validIntervals = ['1min', '5min', '15min', '30min', '1h', 'day'];
  return validIntervals.includes(interval);
}

/**
 * Validate option type
 */
function isValidOptionType(type) {
  return ['CE', 'PE'].includes(type?.toUpperCase());
}

/**
 * Validate strike price
 */
function isValidStrike(strike) {
  const num = parseInt(strike);
  return !isNaN(num) && num > 0 && num % 50 === 0; // Nifty strikes are multiples of 50
}

/**
 * Validate order side
 */
function isValidOrderSide(side) {
  return ['BUY', 'SELL'].includes(side?.toUpperCase());
}

/**
 * Validate quantity
 */
function isValidQuantity(quantity) {
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0 && num <= 100; // Reasonable limits
}

/**
 * Validate session ID
 */
function isValidSessionId(sessionId) {
  return typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 50;
}

/**
 * Validate expiry date (should be a future Tuesday)
 */
function isValidExpiry(expiryString) {
  if (!isValidDate(expiryString)) return false;
  
  const expiry = new Date(expiryString);
  const today = new Date();
  
  // Should be in future
  if (expiry <= today) return false;
  
  // Should be a Tuesday
  return expiry.getDay() === 2;
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Validate pagination parameters
 */
function validatePagination(limit, offset) {
  const limitNum = parseInt(limit) || 10;
  const offsetNum = parseInt(offset) || 0;
  
  return {
    limit: Math.min(Math.max(limitNum, 1), 100), // Between 1 and 100
    offset: Math.max(offsetNum, 0) // Minimum 0
  };
}

module.exports = {
  isValidDate,
  isValidInterval,
  isValidOptionType,
  isValidStrike,
  isValidOrderSide,
  isValidQuantity,
  isValidSessionId,
  isValidExpiry,
  sanitizeString,
  validatePagination
};