const { ChessNotationAnalyzer } = require('./chess-notation-analyzer');
const fs = require('fs').promises;

class DogeFeedAnalyzer extends ChessNotationAnalyzer {
  // Convert feed event to our standard format
  convertFeedEventToTrade(feedEvent) {
    const data = feedEvent.data;
    const user = feedEvent.user;
    
    // Calculate effective price from trade amount and contracts
    let effectivePrice = 0.5; // Default neutral price
    
    if (data.contracts && data.tradeAmount) {
      const contracts = parseFloat(data.contracts);
      const amount = Math.abs(parseFloat(data.tradeAmount));
      
      if (data.outcome === 'YES') {
        effectivePrice = amount / contracts;
      } else {
        effectivePrice = 1 - (amount / contracts);
      }
    }
    
    // Handle sell orders (negative amounts)
    const isSell = data.strategy === 'Sell' || parseFloat(data.tradeAmount) < 0;
    const tradeAmount = Math.abs(parseFloat(data.tradeAmount)) * 1000000; // Convert to "wei" format
    
    return {
      createdAt: feedEvent.timestamp,
      takerAmount: tradeAmount.toString(),
      price: Math.max(0.001, Math.min(0.999, effectivePrice)), // Clamp price
      profile: {
        id: user.id,
        account: user.account,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        socialUrl: user.socialUrl,
        rankId: user.rankId,
        rankName: user.rankName,
        rankFeeRateBps: user.rankFeeRateBps,
        points: user.points,
        leaderboardPosition: user.leaderboardPosition,
        referredUsersCount: user.referredUsersCount
      },
      displayName: user.displayName || user.username,
      pfpUrl: user.pfpUrl,
      side: data.outcome === 'YES' ? 0 : 1,
      strategy: data.strategy,
      outcome: data.outcome,
      isSell: isSell,
      originalAmount: data.tradeAmount,
      contracts: data.contracts
    };
  }

  // Enhanced move type with buy/sell indicators
  getMoveType(price, isSell, outcome) {
    const sellIndicator = isSell ? '↓' : '↑';
    const outcomeShort = outcome === 'YES' ? 'Y' : 'N';
    
    if (price >= 0.8) return `${outcomeShort}++${sellIndicator}`; // Strong bet
    if (price >= 0.6) return `${outcomeShort}+${sellIndicator}`;  // Moderate bet
    if (price >= 0.4) return `${outcomeShort}${sellIndicator}`;   // Neutral bet
    if (price >= 0.2) return `${outcomeShort}-${sellIndicator}`;  // Weak opposite
    return `${outcomeShort}--${sellIndicator}`;                   // Strong opposite
  }

  // Enhanced chess notation for DOGE trades
  createDogeChessNotation(trades) {
    console.log('🐕 DOGE Market Trading Game: $0.24072 Prediction 🐕');
    console.log('═'.repeat(70));
    console.log();

    let notation = [];
    let currentPair = '';

    trades.forEach((trade, index) => {
      const trader = this.getTraderPiece(trade.profile);
      const amount = this.formatAmount(trade.takerAmount);
      const price = trade.price.toFixed(3);
      const moveType = this.getMoveType(trade.price, trade.isSell, trade.outcome);
      const time = new Date(trade.createdAt).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      // Enhanced move notation
      const strategyIcon = trade.isSell ? '📉' : '📈';
      const move = `${trader.piece}${moveType}$${amount}@${price}`;
      
      if (index % 2 === 0) {
        currentPair = `${this.moveCounter}.${move}`;
      } else {
        currentPair += ` ${move}`;
        notation.push(currentPair);
        this.moveCounter++;
      }

      if (index === trades.length - 1 && index % 2 === 0) {
        notation.push(currentPair);
      }

      const displayName = trader.displayName.length > 25 ? 
        trader.displayName.substring(0, 22) + '...' : trader.displayName;

      console.log(`${time} │ ${trader.piece} ${displayName} │ ${strategyIcon} ${moveType} $${amount} @ ${price} │ ${trade.outcome} │ Rank: ${trader.rank}`);
    });

    return notation;
  }

  // Analyze DOGE market using feed events
  async analyzeDogeMarketFromFeed() {
    try {
      console.log('🔍 Fetching DOGE market data from API...');
      
      const response = await fetch('https://api.limitless.exchange/markets/dollardoge-above-dollar024072-on-aug-13-1600-utc-1755097212172');
      const marketData = await response.json();
      
      if (!marketData.feedEvents || marketData.feedEvents.length === 0) {
        console.log('⚠️ No feed events found for DOGE market');
        return [];
      }

      console.log(`📊 Found ${marketData.feedEvents.length} trading events`);
      
      // Convert feed events to our standard format
      const trades = marketData.feedEvents
        .filter(event => event.eventType === 'NEW_TRADE')
        .map(event => this.convertFeedEventToTrade(event))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort chronologically

      console.log(`🔄 Processed ${trades.length} valid trades\n`);

      // Create chess notation
      const notation = this.createDogeChessNotation(trades);

      console.log('\n' + '═'.repeat(70));
      console.log('♟️ DOGE CHESS NOTATION SEQUENCE');
      console.log('═'.repeat(70));
      
      notation.forEach(move => {
        console.log(move);
      });

      // Display summary
      this.displayDogeGameSummary(marketData);

      // Save data
      const filename = 'doge-market-data.json';
      await fs.writeFile(filename, JSON.stringify(trades, null, 2));
      
      const chessFile = 'doge-chess-notation.txt';
      const chessContent = [
        'DOGE Market Trading Game: $0.24072 Prediction',
        '═'.repeat(50),
        '',
        'CHESS NOTATION:',
        ...notation,
        '',
        'LEGEND:',
        '♔♕♖♗♘♙♚♛♜♝♞♟ = Different traders',
        'Y++/Y+/Y/Y-/Y-- = YES bets (strong to weak)',
        'N++/N+/N/N-/N-- = NO bets (strong to weak)',  
        '↑ = Buy order, ↓ = Sell order',
        '📈 = Buy strategy, 📉 = Sell strategy',
        '$X.XX = Trade amount in USDC',
        '@X.XXX = Effective execution price',
      ].join('\n');

      await fs.writeFile(chessFile, chessContent);
      console.log(`\n💾 Files saved: ${filename} and ${chessFile}`);

      return { trades, notation, marketData };

    } catch (error) {
      console.error('❌ Error analyzing DOGE market:', error.message);
      throw error;
    }
  }

  // Enhanced game summary for DOGE
  displayDogeGameSummary(marketData) {
    console.log('\n' + '═'.repeat(70));
    console.log('🏆 DOGE GAME SUMMARY');
    console.log('═'.repeat(70));

    const sortedTraders = Array.from(this.traders.entries())
      .sort(([,a], [,b]) => b.trades - a.trades);

    console.log('\n👥 TOP PLAYERS:');
    sortedTraders.slice(0, 10).forEach(([address, trader], index) => {
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      console.log(`${index + 1}. ${trader.piece} ${trader.displayName} (${shortAddress})`);
      console.log(`   Rank: ${trader.rank} | Points: ${trader.points} | Position: #${trader.position} | Moves: ${trader.trades}`);
      console.log();
    });

    console.log('📊 MARKET INFO:');
    console.log(`Market Status: ${marketData.status}`);
    console.log(`Total Volume: $${parseFloat(marketData.volumeFormatted).toLocaleString()}`);
    console.log(`Liquidity: $${parseFloat(marketData.liquidityFormatted).toLocaleString()}`);
    console.log(`Resolution Price: $${marketData.metadata?.resolvePrice || 'N/A'}`);
    console.log(`Target Price: $0.24072`);
    console.log(`Result: ${marketData.metadata?.resolvePrice > 0.24072 ? 'YES (Target Hit!)' : 'NO (Target Missed)'}`);
    
    console.log(`\n⚡ ACTIVITY STATS:`);
    console.log(`Total Players: ${this.traders.size}`);
    console.log(`Total Moves: ${this.moveCounter - 1}`);
    console.log(`Most Active: ${sortedTraders[0][1].displayName} (${sortedTraders[0][1].trades} moves)`);
  }
}

// Main execution
async function main() {
  const analyzer = new DogeFeedAnalyzer();
  
  try {
    await analyzer.analyzeDogeMarketFromFeed();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DogeFeedAnalyzer };