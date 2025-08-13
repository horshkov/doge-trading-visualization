const fs = require('fs').promises;

class ReadableFormatAnalyzer {
  // Format contracts for readability
  formatContracts(contracts) {
    const contractAmount = parseFloat(contracts);
    if (contractAmount >= 1000) {
      return (contractAmount / 1000).toFixed(1) + 'K';
    }
    return contractAmount.toFixed(1);
  }

  // Format readable timestamp
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  // Clean trader name for display
  cleanTraderName(displayName, username, account) {
    if (displayName && displayName !== account) {
      return displayName;
    }
    if (username) {
      return username;
    }
    // Shorten address
    return account.slice(0, 6) + '...' + account.slice(-4);
  }

  // Convert feed event to readable format
  convertFeedEventToReadable(feedEvent) {
    const data = feedEvent.data;
    const user = feedEvent.user;
    
    const isSell = data.strategy === 'Sell' || parseFloat(data.tradeAmount) < 0;
    const contracts = parseFloat(data.contracts);
    const direction = data.outcome;
    const strategy = isSell ? 'SELL' : 'BUY';
    
    return {
      timestamp: feedEvent.timestamp,
      time: this.formatTime(feedEvent.timestamp),
      contracts: contracts,
      contractsFormatted: this.formatContracts(data.contracts),
      direction: direction,
      strategy: strategy,
      traderName: this.cleanTraderName(user.displayName, user.username, user.account),
      traderAccount: user.account,
      tradeAmountUSD: parseFloat(data.tradeAmountUSD),
      price: this.calculateEffectivePrice(data)
    };
  }

  calculateEffectivePrice(data) {
    if (data.contracts && data.tradeAmount) {
      const contracts = parseFloat(data.contracts);
      const amount = Math.abs(parseFloat(data.tradeAmount));
      
      if (data.outcome === 'YES') {
        return amount / contracts;
      } else {
        return 1 - (amount / contracts);
      }
    }
    return 0.5; // Default
  }

  // Analyze and display in readable format
  async analyzeInReadableFormat() {
    try {
      console.log('📊 LIMITLESS EXCHANGE TRADING DATA - READABLE FORMAT');
      console.log('═'.repeat(80));
      console.log();

      // Analyze DOGE market
      console.log('🐕 DOGE Market: $0.24072 Target Price');
      console.log('─'.repeat(80));
      
      const response = await fetch('https://api.limitless.exchange/markets/dollardoge-above-dollar024072-on-aug-13-1600-utc-1755097212172');
      const marketData = await response.json();
      
      if (!marketData.feedEvents || marketData.feedEvents.length === 0) {
        console.log('⚠️ No DOGE trading data found');
        return;
      }

      const trades = marketData.feedEvents
        .filter(event => event.eventType === 'NEW_TRADE')
        .map(event => this.convertFeedEventToReadable(event))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      console.log(`Total Trades: ${trades.length}`);
      console.log(`Market Result: ${marketData.metadata?.resolvePrice > 0.24072 ? '✅ YES ($0.24124 > $0.24072)' : '❌ NO'}`);
      console.log();

      // Display trades in clean format
      console.log('TIME     │ AMOUNT & DIRECTION │ TRADER');
      console.log('─'.repeat(80));
      
      trades.forEach(trade => {
        const directionIcon = trade.direction === 'YES' ? '🟢' : '🔴';
        const strategyIcon = trade.strategy === 'BUY' ? '📈' : '📉';
        const amountStr = `${trade.contractsFormatted} contracts`;
        const directionStr = `${directionIcon} ${trade.strategy} ${trade.direction}`;
        
        console.log(`${trade.time} │ ${amountStr.padEnd(8)} ${directionStr.padEnd(12)} │ ${trade.traderName}`);
      });

      // Summary statistics
      this.displayReadableSummary(trades, marketData);

      // Save readable format
      await this.saveReadableData(trades, marketData);

      return trades;

    } catch (error) {
      console.error('❌ Error analyzing data:', error.message);
      throw error;
    }
  }

  // Display summary in readable format
  displayReadableSummary(trades, marketData) {
    console.log('\n' + '═'.repeat(80));
    console.log('📈 TRADING SUMMARY');
    console.log('═'.repeat(80));

    // Count YES vs NO trades
    const yesTrades = trades.filter(t => t.direction === 'YES');
    const noTrades = trades.filter(t => t.direction === 'NO');
    const buyTrades = trades.filter(t => t.strategy === 'BUY');
    const sellTrades = trades.filter(t => t.strategy === 'SELL');

    console.log(`\n🎯 BETTING DIRECTION:`);
    console.log(`🟢 YES bets: ${yesTrades.length} trades`);
    console.log(`🔴 NO bets:  ${noTrades.length} trades`);
    
    console.log(`\n💹 TRADING ACTION:`);
    console.log(`📈 BUY orders:  ${buyTrades.length} trades`);
    console.log(`📉 SELL orders: ${sellTrades.length} trades`);

    // Largest positions
    const sortedByContracts = trades.sort((a, b) => b.contracts - a.contracts);
    
    console.log(`\n🏆 LARGEST POSITIONS:`);
    sortedByContracts.slice(0, 5).forEach((trade, index) => {
      const directionIcon = trade.direction === 'YES' ? '🟢' : '🔴';
      const strategyIcon = trade.strategy === 'BUY' ? '📈' : '📉';
      
      console.log(`${index + 1}. ${trade.time} │ ${trade.contractsFormatted} contracts │ ${directionIcon} ${trade.direction} │ ${strategyIcon} ${trade.strategy} │ ${trade.traderName}`);
    });

    // Most active traders
    const traderActivity = new Map();
    trades.forEach(trade => {
      const count = traderActivity.get(trade.traderName) || 0;
      traderActivity.set(trade.traderName, count + 1);
    });

    const sortedTraders = Array.from(traderActivity.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log(`\n👑 MOST ACTIVE TRADERS:`);
    sortedTraders.forEach(([traderName, tradeCount], index) => {
      console.log(`${index + 1}. ${traderName} │ ${tradeCount} trades`);
    });

    console.log(`\n💰 MARKET INFO:`);
    console.log(`Total Volume: $${parseFloat(marketData.volumeFormatted).toLocaleString()}`);
    console.log(`Final Price: $${marketData.metadata?.resolvePrice?.toFixed(6) || 'N/A'}`);
    console.log(`Target Price: $0.24072`);
    console.log(`Result: ${marketData.metadata?.resolvePrice > 0.24072 ? '✅ Target Hit - YES wins!' : '❌ Target Missed - NO wins!'}`);
  }

  // Save data in readable CSV format
  async saveReadableData(trades, marketData) {
    try {
      // CSV format
      const csvHeader = 'Time,Date,Contracts,Direction,Strategy,Trader,USD_Amount,Price\n';
      const csvRows = trades.map(trade => {
        const date = new Date(trade.timestamp).toISOString().split('T')[0];
        return [
          trade.time,
          date,
          trade.contracts.toFixed(1),
          trade.direction,
          trade.strategy,
          `"${trade.traderName}"`,
          trade.tradeAmountUSD.toFixed(2),
          trade.price.toFixed(4)
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      await fs.writeFile('doge-trading-readable.csv', csvContent);

      // JSON format for further analysis
      const readableJson = {
        market: {
          title: 'DOGE above $0.24072',
          targetPrice: 0.24072,
          finalPrice: marketData.metadata?.resolvePrice,
          result: marketData.metadata?.resolvePrice > 0.24072 ? 'YES' : 'NO',
          totalVolume: parseFloat(marketData.volumeFormatted),
          totalTrades: trades.length
        },
        trades: trades.map(trade => ({
          time: trade.time,
          date: new Date(trade.timestamp).toISOString().split('T')[0],
          contracts: trade.contracts,
          contractsFormatted: trade.contractsFormatted,
          direction: trade.direction,
          strategy: trade.strategy,
          trader: trade.traderName,
          usdAmount: trade.tradeAmountUSD,
          price: trade.price
        }))
      };

      await fs.writeFile('doge-trading-readable.json', JSON.stringify(readableJson, null, 2));

      console.log(`\n💾 Data saved to:`);
      console.log(`   📄 doge-trading-readable.csv (spreadsheet format)`);
      console.log(`   📄 doge-trading-readable.json (structured data)`);

    } catch (error) {
      console.error('❌ Error saving data:', error.message);
    }
  }
}

// Main execution
async function main() {
  const analyzer = new ReadableFormatAnalyzer();
  
  try {
    await analyzer.analyzeInReadableFormat();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ReadableFormatAnalyzer };