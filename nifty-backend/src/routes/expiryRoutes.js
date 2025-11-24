const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @desc    Get expiry schedule and information
 * @route   GET /api/expiry/schedule
 * @access  Public
 */
const getExpirySchedule = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  // Get all Tuesdays for the specified month/year or current month
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // Month is 0-indexed
  
  const tuesdays = [];
  const date = new Date(targetYear, targetMonth, 1);
  
  // Find all Tuesdays in the month
  while (date.getMonth() === targetMonth) {
    if (date.getDay() === 2) { // Tuesday
      tuesdays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  
  // Add information about each Tuesday
  const expirySchedule = tuesdays.map(tuesday => {
    const today = new Date();
    const isExpired = tuesday < today;
    const isCurrent = tuesday.toDateString() === today.toDateString();
    const daysToExpiry = Math.ceil((tuesday - today) / (1000 * 60 * 60 * 24));
    
    return {
      date: tuesday.toISOString().split('T')[0],
      formatted: tuesday.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dayOfWeek: 'Tuesday',
      isExpired,
      isCurrent,
      daysToExpiry: isExpired ? 0 : daysToExpiry,
      week: Math.ceil(tuesday.getDate() / 7)
    };
  });
  
  res.status(200).json({
    success: true,
    data: {
      year: targetYear,
      month: targetMonth + 1,
      monthName: new Date(targetYear, targetMonth).toLocaleDateString('en-IN', { month: 'long' }),
      expiries: expirySchedule,
      currentExpiry: expirySchedule.find(exp => !exp.isExpired) || expirySchedule[expirySchedule.length - 1],
      totalExpiries: expirySchedule.length
    }
  });
});

/**
 * @desc    Get next available expiry
 * @route   GET /api/expiry/next
 * @access  Public
 */
const getNextExpiry = asyncHandler(async (req, res) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 2 = Tuesday
  const currentHour = today.getHours();
  
  let nextExpiry = new Date(today);
  
  if (currentDay === 2 && currentHour < 15) {
    // If today is Tuesday and before 3:30 PM, current expiry is today
    // Keep nextExpiry as today
  } else {
    // Find next Tuesday
    const daysUntilTuesday = (2 - currentDay + 7) % 7;
    nextExpiry.setDate(today.getDate() + (daysUntilTuesday === 0 ? 7 : daysUntilTuesday));
  }
  
  // Also get the following expiry
  const followingExpiry = new Date(nextExpiry);
  followingExpiry.setDate(nextExpiry.getDate() + 7);
  
  res.status(200).json({
    success: true,
    data: {
      current: {
        date: nextExpiry.toISOString().split('T')[0],
        formatted: nextExpiry.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        daysToExpiry: Math.ceil((nextExpiry - today) / (1000 * 60 * 60 * 24)),
        isToday: nextExpiry.toDateString() === today.toDateString()
      },
      next: {
        date: followingExpiry.toISOString().split('T')[0],
        formatted: followingExpiry.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        daysToExpiry: Math.ceil((followingExpiry - today) / (1000 * 60 * 60 * 24))
      }
    }
  });
});

/**
 * @desc    Check if market is in expiry session
 * @route   GET /api/expiry/status
 * @access  Public
 */
const getExpiryStatus = asyncHandler(async (req, res) => {
  const today = new Date();
  const istTime = new Date(today.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
  const day = istTime.getDay();
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  
  const isExpiryDay = day === 2; // Tuesday
  const isExpirySession = isExpiryDay && hour >= 15 && hour < 16; // 3:00 PM - 4:00 PM
  const isPreExpirySession = isExpiryDay && hour >= 14 && hour < 15; // 2:00 PM - 3:00 PM
  
  let status = 'NORMAL';
  if (isExpirySession) {
    status = 'EXPIRY_SESSION';
  } else if (isPreExpirySession) {
    status = 'PRE_EXPIRY';
  }
  
  res.status(200).json({
    success: true,
    data: {
      isExpiryDay,
      isExpirySession,
      isPreExpirySession,
      status,
      currentTime: istTime.toISOString(),
      timezone: 'Asia/Kolkata',
      message: {
        'NORMAL': 'Regular trading session',
        'PRE_EXPIRY': 'Approaching expiry session - increased volatility expected',
        'EXPIRY_SESSION': 'Options expiry in progress - high volatility expected'
      }[status]
    }
  });
});

// Routes
router.get('/schedule', getExpirySchedule);
router.get('/next', getNextExpiry);
router.get('/status', getExpiryStatus);

module.exports = router;