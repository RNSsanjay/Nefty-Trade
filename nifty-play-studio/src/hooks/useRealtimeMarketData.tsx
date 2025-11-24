import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';

interface NiftyData {
  value: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
}

interface OptionChainItem {
  strike: number;
  ce: {
    ltp: number;
    change: number;
    changePercent: number;
  };
  pe: {
    ltp: number;
    change: number;
    changePercent: number;
  };
}

export const useRealtimeMarketData = (updateInterval = 3000) => {
  const [niftyData, setNiftyData] = useState<NiftyData>({
    value: 0,
    change: 0,
    changePercent: 0,
    open: 0,
    high: 0,
    low: 0,
  });
  const [optionChain, setOptionChain] = useState<OptionChainItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);

      // Fetch live Nifty data
      const niftyResponse = await apiService.getLiveNiftyData();
      if (niftyResponse.success && niftyResponse.data) {
        setNiftyData({
          value: niftyResponse.data.value || 0,
          change: niftyResponse.data.change || 0,
          changePercent: niftyResponse.data.changePercent || 0,
          open: niftyResponse.data.open || 0,
          high: niftyResponse.data.high || 0,
          low: niftyResponse.data.low || 0,
        });
      }

      // Fetch option chain
      const chainResponse = await apiService.getOptionChain();
      if (chainResponse.success && chainResponse.data) {
        setOptionChain(chainResponse.data);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLTP = useCallback((strike: number, optionType: 'CE' | 'PE'): number => {
    const option = optionChain.find(item => item.strike === strike);
    if (!option) return 0;

    return optionType === 'CE' ? option.ce.ltp : option.pe.ltp;
  }, [optionChain]);

  useEffect(() => {
    // Initial fetch
    fetchMarketData();

    // Set up interval for updates
    const interval = setInterval(fetchMarketData, updateInterval);

    return () => clearInterval(interval);
  }, [fetchMarketData, updateInterval]);

  return {
    niftyData,
    optionChain,
    lastUpdate,
    loading,
    error,
    getLTP,
    refetch: fetchMarketData,
  };
};
