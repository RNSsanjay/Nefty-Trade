const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    private async request(endpoint: string, options?: RequestInit) {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            mode: 'cors',
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return response.json();
    }

    // Nifty endpoints
    async getLiveNiftyData() {
        return this.request('/nifty/live');
    }

    async getNiftyHistory(date: string, interval: string = 'day') {
        return this.request(`/nifty/history?date=${date}&interval=${interval}`);
    }

    async getNiftyRange(startDate: string, endDate: string) {
        return this.request(`/nifty/range?startDate=${startDate}&endDate=${endDate}`);
    }

    async getMarketStatus() {
        return this.request('/nifty/status');
    }

    // Options endpoints
    async getLiveOptionData(strike: number, optionType: 'CE' | 'PE', expiry: string) {
        return this.request(`/options/live?strike=${strike}&optionType=${optionType}&expiry=${expiry}`);
    }

    async getOptionChain() {
        return this.request('/options/chain');
    }

    async getOptionHistory(strike: number, optionType: 'CE' | 'PE', date: string) {
        return this.request(`/options/history?strike=${strike}&optionType=${optionType}&date=${date}`);
    }

    async getAvailableExpiries() {
        return this.request('/options/expiries');
    }

    async getAvailableStrikes() {
        return this.request('/options/strikes');
    }

    // Paper trading endpoints
    async placeOrder(orderData: any) {
        return this.request('/papertrade/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async getOrders() {
        return this.request('/papertrade/orders');
    }

    async getPortfolio() {
        return this.request('/papertrade/portfolio');
    }

    async getPnL() {
        return this.request('/papertrade/pnl');
    }

    async resetPortfolio() {
        return this.request('/papertrade/reset', {
            method: 'POST',
        });
    }

    // Expiry endpoints
    async getExpirySchedule() {
        return this.request('/expiry/schedule');
    }

    async getNextExpiry() {
        return this.request('/expiry/next');
    }

    async getExpiryStatus() {
        return this.request('/expiry/status');
    }
}

export const apiService = new ApiService();