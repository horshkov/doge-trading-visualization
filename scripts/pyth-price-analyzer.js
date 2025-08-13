const fs = require('fs').promises;

class PythPriceAnalyzer {
  constructor() {
    this.dogeId = '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c';
    this.targetPrice = 0.24072;
  }

  // Get latest price from Pyth
  async getLatestPrice() {
    try {
      const url = `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${this.dogeId}`;
      
      console.log('🔍 Fetching latest DOGE price from Pyth Network...');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.parsed && data.parsed.length > 0) {
        const priceData = data.parsed[0];
        return this.parsePythPrice(priceData);
      }
      
      throw new Error('No price data found');
    } catch (error) {
      console.error('❌ Error fetching Pyth price:', error.message);
      throw error;
    }
  }

  // Get historical price data for specific timestamps
  async getHistoricalPrices(timestamps) {
    console.log(`🕐 Attempting to fetch historical prices for ${timestamps.length} timestamps...`);
    
    const prices = [];
    
    // Note: Pyth historical API might be limited, we'll try different approaches
    for (let i = 0; i < Math.min(timestamps.length, 5); i++) { // Limit to avoid rate limits
      try {
        const timestamp = Math.floor(new Date(timestamps[i]).getTime() / 1000);
        console.log(`   Trying timestamp: ${timestamps[i]} (${timestamp})`);
        
        // Try different API endpoints for historical data
        const historicalUrl = `https://hermes.pyth.network/v2/updates/price/${timestamp}?ids%5B%5D=${this.dogeId}`;
        
        const response = await fetch(historicalUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.parsed && data.parsed.length > 0) {
            const priceInfo = this.parsePythPrice(data.parsed[0]);
            prices.push({
              timestamp: timestamps[i],
              ...priceInfo
            });
          }
        }
        
        // Add delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ⚠️ Could not fetch price for ${timestamps[i]}: ${error.message}`);
      }
    }
    
    return prices;
  }

  // Parse Pyth price format
  parsePythPrice(priceData) {
    const price = priceData.price;
    const expo = price.expo;
    const priceValue = parseInt(price.price) * Math.pow(10, expo);
    
    return {
      price: priceValue,
      confidence: parseInt(price.conf) * Math.pow(10, expo),
      publishTime: new Date(price.publish_time * 1000),
      priceId: priceData.id
    };
  }

  // Analyze trading vs actual price data
  async analyzeTradingVsPriceData() {
    try {
      console.log('📊 DOGE TRADING vs REAL PRICE ANALYSIS');
      console.log('═'.repeat(70));
      console.log();

      // Load our trading data
      console.log('📈 Loading trading data...');
      const response = await fetch('https://api.limitless.exchange/markets/dollardoge-above-dollar024072-on-aug-13-1600-utc-1755097212172');
      const marketData = await response.json();
      
      if (!marketData.feedEvents || marketData.feedEvents.length === 0) {
        console.log('⚠️ No trading data found');
        return;
      }

      const trades = marketData.feedEvents
        .filter(event => event.eventType === 'NEW_TRADE')
        .map(event => ({
          timestamp: event.timestamp,
          time: new Date(event.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
          }),
          contracts: parseFloat(event.data.contracts),
          direction: event.data.outcome,
          strategy: event.data.strategy,
          trader: event.user.displayName || event.user.username || 
                 (event.user.account.slice(0, 6) + '...' + event.user.account.slice(-4)),
          tradeAmountUSD: parseFloat(event.data.tradeAmountUSD)
        }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log(`Found ${trades.length} trades from ${trades[0].time} to ${trades[trades.length - 1].time}`);
      console.log();

      // Get current price
      console.log('💰 Current DOGE Price from Pyth:');
      const currentPrice = await this.getLatestPrice();
      console.log(`   Price: $${currentPrice.price.toFixed(6)}`);
      console.log(`   Confidence: ±$${currentPrice.confidence.toFixed(6)}`);
      console.log(`   Published: ${currentPrice.publishTime.toISOString()}`);
      console.log(`   Target: $${this.targetPrice}`);
      console.log(`   Result: ${currentPrice.price > this.targetPrice ? '✅ Above target' : '❌ Below target'}`);
      console.log();

      // Try to get historical prices for key trading moments
      const keyTimestamps = [
        trades[0].timestamp, // First trade
        trades[Math.floor(trades.length / 2)].timestamp, // Middle trade
        trades[trades.length - 1].timestamp, // Last trade
        // Add some specific interesting moments
        ...trades.filter(t => t.contracts > 100).map(t => t.timestamp) // Large trades
      ].slice(0, 10); // Limit to avoid rate limits

      console.log('🕐 Attempting to fetch historical prices...');
      const historicalPrices = await this.getHistoricalPrices(keyTimestamps);
      
      if (historicalPrices.length > 0) {
        console.log('\n📈 HISTORICAL PRICE DATA:');
        historicalPrices.forEach(pricePoint => {
          const time = new Date(pricePoint.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
          const vsTarget = pricePoint.price > this.targetPrice ? '🟢 ABOVE' : '🔴 BELOW';
          console.log(`   ${time} │ $${pricePoint.price.toFixed(6)} │ ${vsTarget} target │ ±$${pricePoint.confidence.toFixed(6)}`);
        });
      } else {
        console.log('\n⚠️ Could not fetch historical price data from Pyth API');
        console.log('   This might be due to API limitations or the specific time range');
      }

      // Analyze trading patterns vs market resolution
      console.log('\n🎯 TRADING ANALYSIS:');
      
      const finalPrice = marketData.metadata?.resolvePrice || currentPrice.price;
      const targetHit = finalPrice > this.targetPrice;
      
      console.log(`   Market Resolution: $${finalPrice.toFixed(6)}`);
      console.log(`   Target ($${this.targetPrice}): ${targetHit ? '✅ HIT' : '❌ MISSED'}`);
      
      // Analyze YES vs NO bets
      const yesBets = trades.filter(t => t.direction === 'YES');
      const noBets = trades.filter(t => t.direction === 'NO');
      
      const yesVolume = yesBets.reduce((sum, t) => sum + Math.abs(t.tradeAmountUSD), 0);
      const noVolume = noBets.reduce((sum, t) => sum + Math.abs(t.tradeAmountUSD), 0);
      
      console.log(`\n📊 BETTING ACCURACY:`);
      console.log(`   YES bets: ${yesBets.length} trades, $${yesVolume.toFixed(2)} volume`);
      console.log(`   NO bets: ${noBets.length} trades, $${noVolume.toFixed(2)} volume`);
      console.log(`   Winning side: ${targetHit ? 'YES bettors' : 'NO bettors'} ✅`);
      console.log(`   Market sentiment: ${yesVolume > noVolume ? 'Bullish' : 'Bearish'} (${((yesVolume / (yesVolume + noVolume)) * 100).toFixed(1)}% YES volume)`);

      // Show the biggest bets and their accuracy
      const bigBets = trades.filter(t => t.contracts > 50).sort((a, b) => b.contracts - a.contracts);
      
      if (bigBets.length > 0) {
        console.log(`\n🏆 BIG BET ACCURACY:`);
        bigBets.slice(0, 5).forEach(bet => {
          const wasRight = (bet.direction === 'YES' && targetHit) || (bet.direction === 'NO' && !targetHit);
          const accuracy = wasRight ? '✅ CORRECT' : '❌ WRONG';
          console.log(`   ${bet.time} │ ${bet.trader} │ ${bet.contracts.toFixed(1)} contracts ${bet.direction} │ ${accuracy}`);
        });
      }

      // Save combined analysis
      await this.savePriceAnalysis({
        trades,
        currentPrice,
        historicalPrices,
        marketData,
        analysis: {
          targetPrice: this.targetPrice,
          finalPrice,
          targetHit,
          yesBets: yesBets.length,
          noBets: noBets.length,
          yesVolume,
          noVolume,
          marketSentiment: yesVolume > noVolume ? 'Bullish' : 'Bearish',
          sentimentAccuracy: (yesVolume > noVolume && targetHit) || (yesVolume < noVolume && !targetHit)
        }
      });

      return { trades, currentPrice, historicalPrices, marketData };

    } catch (error) {
      console.error('❌ Error in price analysis:', error.message);
      throw error;
    }
  }

  // Save the complete analysis
  async savePriceAnalysis(data) {
    try {
      const analysis = {
        timestamp: new Date().toISOString(),
        market: {
          title: 'DOGE above $0.24072 Analysis',
          targetPrice: data.analysis.targetPrice,
          finalPrice: data.analysis.finalPrice,
          targetHit: data.analysis.targetHit
        },
        pythPrice: {
          current: data.currentPrice,
          historical: data.historicalPrices
        },
        trading: {
          totalTrades: data.trades.length,
          yesBets: data.analysis.yesBets,
          noBets: data.analysis.noBets,
          yesVolume: data.analysis.yesVolume,
          noVolume: data.analysis.noVolume,
          marketSentiment: data.analysis.marketSentiment,
          sentimentAccuracy: data.analysis.sentimentAccuracy
        },
        trades: data.trades
      };

      await fs.writeFile('doge-price-vs-trading-analysis.json', JSON.stringify(analysis, null, 2));
      console.log('\n💾 Complete analysis saved to: doge-price-vs-trading-analysis.json');
      
    } catch (error) {
      console.error('❌ Error saving analysis:', error.message);
    }
  }
}

// Main execution
async function main() {
  const analyzer = new PythPriceAnalyzer();
  
  try {
    await analyzer.analyzeTradingVsPriceData();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PythPriceAnalyzer };