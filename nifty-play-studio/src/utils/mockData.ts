// Generate time intervals from 9:15 AM to 3:30 PM
export const generateTimeIntervals = (intervalMinutes: number): string[] => {
  const intervals: string[] = [];
  const startHour = 9;
  const startMinute = 15;
  const endHour = 15;
  const endMinute = 30;

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    intervals.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
    
    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return intervals;
};

// Generate mock LTP data for options
export const generateMockLTP = (strike: number, optionType: 'CE' | 'PE', niftyValue: number): number => {
  const moneyness = optionType === 'CE' ? niftyValue - strike : strike - niftyValue;
  
  if (moneyness > 0) {
    // ITM
    return moneyness + Math.random() * 50 + 20;
  } else if (moneyness > -100 && moneyness <= 0) {
    // ATM
    return Math.random() * 100 + 50;
  } else {
    // OTM
    return Math.random() * 30 + 5;
  }
};

// Generate option chain data
export const generateOptionChain = (niftyValue: number) => {
  const strikes: number[] = [];
  const baseStrike = Math.round(niftyValue / 50) * 50;
  
  for (let i = -15; i <= 15; i++) {
    strikes.push(baseStrike + (i * 50));
  }

  return strikes.map(strike => {
    const ceLTP = generateMockLTP(strike, 'CE', niftyValue);
    const peLTP = generateMockLTP(strike, 'PE', niftyValue);
    
    return {
      strike,
      ce: {
        ltp: parseFloat(ceLTP.toFixed(2)),
        change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        changePercent: parseFloat((Math.random() * 5 - 2.5).toFixed(2)),
      },
      pe: {
        ltp: parseFloat(peLTP.toFixed(2)),
        change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        changePercent: parseFloat((Math.random() * 5 - 2.5).toFixed(2)),
      },
    };
  });
};

// Generate Nifty index data
export const generateNiftyData = () => {
  const baseValue = 25915.34;
  const open = 25899.10;
  const high = 25930.50;
  const low = 25880.25;
  const change = 123.40;
  const changePercent = 0.45;

  return {
    value: baseValue,
    change,
    changePercent,
    open,
    high,
    low,
  };
};

// Generate historical data for a strike
export const generateHistoricalData = (
  strike: number,
  optionType: 'CE' | 'PE',
  date: Date,
  intervalMinutes: number
) => {
  const niftyData = generateNiftyData();
  const times = generateTimeIntervals(intervalMinutes);
  
  return times.map(time => ({
    time,
    ltp: generateMockLTP(strike, optionType, niftyData.value),
  }));
};

export interface BasketItem {
  id: string;
  strike: number;
  optionType: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  expiryDate: string;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
}

export interface Position extends BasketItem {
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

// Expiry dates
export const getExpiryDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + (i * 7));
    dates.push({
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: date.toISOString().split('T')[0],
    });
  }
  
  return dates;
};
