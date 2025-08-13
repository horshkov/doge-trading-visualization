const axios = require('axios');

// Limitless Exchange API configuration
const API_BASE_URL = 'https://api.limitless.exchange';

// Create axios instance for API calls
const limitlessApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

class LimitlessTrader {
  constructor() {
    this.api = limitlessApi;
  }

  // Get supported tokens
  async getSupportedTokens() {
    try {
      const response = await this.api.get('/tokens');
      return response.data;
    } catch (error) {
      console.error('Error fetching tokens:', error.message);
      throw error;
    }
  }

  // Get active markets
  async getActiveMarkets(params = {}) {
    try {
      const response = await this.api.get('/markets/active', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching active markets:', error.message);
      throw error;
    }
  }

  // Get specific market by address
  async getMarket(address) {
    try {
      const response = await this.api.get(`/markets/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching market ${address}:`, error.message);
      throw error;
    }
  }

  // Get market trades/activity
  async getMarketTrades(address) {
    try {
      const response = await this.api.get(`/markets/${address}/trades`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trades for market ${address}:`, error.message);
      throw error;
    }
  }

  // Get tags/categories
  async getTags() {
    try {
      const response = await this.api.get('/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error.message);
      throw error;
    }
  }
}

// Example usage
async function main() {
  const trader = new LimitlessTrader();

  try {
    console.log('🚀 Limitless Exchange Trading Bot Started\n');

    // Get supported tokens
    console.log('📊 Fetching supported tokens...');
    const tokens = await trader.getSupportedTokens();
    console.log(`Found ${tokens.length} supported tokens:`, tokens.map(t => t.symbol).join(', '));
    console.log();

    // Get active markets
    console.log('🏪 Fetching active markets...');
    const marketsResponse = await trader.getActiveMarkets({ limit: 5 });
    const markets = Array.isArray(marketsResponse) ? marketsResponse : marketsResponse.data || [];
    console.log(`Found ${markets.length} active markets:`);
    
    markets.slice(0, 5).forEach((market, index) => {
      console.log(`${index + 1}. ${market.title || market.question || market.name || 'Unknown Market'}`);
      console.log(`   Address: ${market.address || market.id}`);
      console.log(`   Volume: ${market.volume || market.totalVolume || 'N/A'}`);
      console.log();
    });

    // Get tags
    console.log('🏷️ Fetching market tags...');
    const tags = await trader.getTags();
    console.log(`Found ${tags.length} tags:`, tags.map(t => t.name).join(', '));
    console.log();

  } catch (error) {
    console.error('❌ Error in main execution:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { LimitlessTrader };