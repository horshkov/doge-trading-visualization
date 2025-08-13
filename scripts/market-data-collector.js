const axios = require('axios');
const fs = require('fs').promises;

class MarketDataCollector {
  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.limitless.exchange',
      timeout: 15000,
    });
  }

  // Test the API endpoint and understand response structure
  async testEndpoint(marketId) {
    try {
      console.log('🔍 Testing API endpoint...');
      const response = await this.api.get(`/markets/${marketId}/events?page=1&limit=5`);
      const data = response.data;
      console.log('✅ API response structure:');
      console.log(`- Total pages: ${data.totalPages}`);
      console.log(`- Total rows: ${data.totalRows}`);
      console.log(`- Events in first page: ${data.events?.length || 0}`);
      if (data.events && data.events.length > 0) {
        console.log('- First event keys:', Object.keys(data.events[0]));
        console.log('- Profile keys:', Object.keys(data.events[0].profile || {}));
      }
      return data;
    } catch (error) {
      console.error('❌ Error testing endpoint:', error.message);
      throw error;
    }
  }

  // Collect all trading events from all pages
  async collectAllEvents(marketId) {
    let allEvents = [];
    let totalPages = 1;

    console.log('🚀 Starting data collection...');

    // First, get the total pages info
    try {
      const firstResponse = await this.api.get(`/markets/${marketId}/events`, {
        params: { page: 1, limit: 10 }
      });
      totalPages = firstResponse.data.totalPages;
      console.log(`📊 Found ${totalPages} total pages with ${firstResponse.data.totalRows} total events`);
    } catch (error) {
      console.error('❌ Error getting pagination info:', error.message);
      throw error;
    }

    // Now collect all pages
    for (let page = 1; page <= totalPages; page++) {
      try {
        console.log(`📄 Fetching page ${page}/${totalPages}...`);
        
        const response = await this.api.get(`/markets/${marketId}/events`, {
          params: { page, limit: 10 } // Use smaller limit to avoid rate limits
        });

        const data = response.data;
        
        if (data.events && data.events.length > 0) {
          allEvents = allEvents.concat(data.events);
          console.log(`   Added ${data.events.length} events (total: ${allEvents.length})`);
        }
        
        // Add delay between requests to respect rate limits
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
      } catch (error) {
        console.error(`❌ Error on page ${page}:`, error.message);
        
        if (error.response?.status === 429) {
          console.log('   Rate limited, waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          page--; // Retry the same page
          continue;
        } else if (error.response?.status >= 500) {
          console.log('   Server error, waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          page--; // Retry the same page
          continue;
        } else {
          throw error;
        }
      }
    }

    return allEvents;
  }

  // Extract and format the specified fields
  extractFields(events) {
    console.log('🔧 Extracting specified fields...');
    
    return events.map(event => ({
      createdAt: event.createdAt,
      takerAmount: event.takerAmount,
      price: event.price,
      profile: event.profile,
      displayName: event.profile?.displayName || event.displayName,
      pfpUrl: event.profile?.pfpUrl || event.pfpUrl
    })).filter(event => {
      // Filter out events that don't have the required data
      return event.createdAt && (event.takerAmount !== undefined || event.price !== undefined);
    });
  }

  // Sort data by timestamp
  sortByTimestamp(data) {
    console.log('🔄 Sorting data by timestamp...');
    return data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Save data to JSON file
  async saveToFile(data, filename) {
    try {
      console.log(`💾 Saving data to ${filename}...`);
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`✅ Data saved successfully (${data.length} records)`);
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
      throw error;
    }
  }

  // Main method to collect and process all data
  async collectMarketData(marketId) {
    try {
      // Test endpoint first
      await this.testEndpoint(marketId);
      
      // Collect all events
      const allEvents = await this.collectAllEvents(marketId);
      
      if (allEvents.length === 0) {
        console.log('⚠️ No events found for this market');
        return [];
      }

      // Extract specified fields
      const extractedData = this.extractFields(allEvents);
      
      // Sort by timestamp
      const sortedData = this.sortByTimestamp(extractedData);
      
      // Save to file
      const filename = `market-data-${marketId.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`;
      await this.saveToFile(sortedData, filename);
      
      // Display summary
      console.log('\n📊 Data Collection Summary:');
      console.log(`   Total events collected: ${allEvents.length}`);
      console.log(`   Valid trading events: ${sortedData.length}`);
      console.log(`   Date range: ${sortedData[0]?.createdAt} to ${sortedData[sortedData.length - 1]?.createdAt}`);
      console.log(`   Unique traders: ${new Set(sortedData.map(d => d.displayName)).size}`);
      
      return sortedData;
      
    } catch (error) {
      console.error('❌ Error in data collection:', error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const collector = new MarketDataCollector();
  const marketId = 'dollarbtc-above-dollar12029350-on-aug-13-1400-utc-1755090024498';
  
  console.log('🎯 Collecting market data for:', marketId);
  console.log();
  
  try {
    const data = await collector.collectMarketData(marketId);
    
    // Show first few records as example
    if (data.length > 0) {
      console.log('\n🔍 Sample of collected data:');
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { MarketDataCollector };