const { ChessNotationAnalyzer } = require('./chess-notation-analyzer');
const fs = require('fs').promises;

class ContractsChessAnalyzer extends ChessNotationAnalyzer {
  // Format contracts (position size) instead of trade amounts
  formatContracts(contracts) {
    const contractAmount = parseFloat(contracts);
    if (contractAmount >= 1000) {
      return (contractAmount / 1000).toFixed(1) + 'K';
    }
    return contractAmount.toFixed(1);
  }

  // Convert feed event to our standard format with contracts focus
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
    
    return {
      createdAt: feedEvent.timestamp,
      contracts: data.contracts,
      price: Math.max(0.001, Math.min(0.999, effectivePrice)),
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
      tradeAmount: data.tradeAmount,
      tradeAmountUSD: data.tradeAmountUSD
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

  // Enhanced chess notation focusing on contracts
  createContractsChessNotation(trades) {
    console.log('🐕 DOGE Market Chess: Position Sizes (Contracts) 🐕');
    console.log('═'.repeat(75));
    console.log();

    let notation = [];
    let currentPair = '';

    trades.forEach((trade, index) => {
      const trader = this.getTraderPiece(trade.profile);
      const contracts = this.formatContracts(trade.contracts);
      const price = trade.price.toFixed(3);
      const moveType = this.getMoveType(trade.price, trade.isSell, trade.outcome);
      const time = new Date(trade.createdAt).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      // Contract-focused move notation
      const strategyIcon = trade.isSell ? '📉' : '📈';
      const move = `${trader.piece}${moveType}${contracts}@${price}`;
      
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

      const displayName = trader.displayName.length > 20 ? 
        trader.displayName.substring(0, 17) + '...' : trader.displayName;

      const usdAmount = parseFloat(trade.tradeAmountUSD).toFixed(2);
      console.log(`${time} │ ${trader.piece} ${displayName.padEnd(20)} │ ${strategyIcon} ${moveType} ${contracts.padStart(6)} contracts @ ${price} │ $${usdAmount.padStart(7)} │ ${trade.outcome}`);
    });

    return notation;
  }

  // Analyze both BTC and DOGE markets with contracts focus
  async analyzeBothMarketsWithContracts() {
    try {
      console.log('🔄 Analyzing both markets with contracts focus...\n');

      // Analyze BTC market (from existing data)
      console.log('⚡ BTC MARKET ANALYSIS (Converting amounts to estimated contracts)');
      console.log('═'.repeat(60));
      
      const btcFile = await fs.readdir('.')
        .then(files => files.find(file => file.includes('dollarbtc-above-dollar120293') && file.endsWith('.json')));
      
      if (btcFile) {
        const btcData = JSON.parse(await fs.readFile(btcFile, 'utf8'));
        console.log('BTC trades with estimated contract positions:');
        
        btcData.forEach((trade, index) => {
          const trader = this.getTraderPiece(trade.profile);
          const amountUSD = parseFloat(trade.takerAmount) / 1000000;
          const estimatedContracts = (amountUSD / trade.price).toFixed(1); // Rough estimate
          const time = new Date(trade.createdAt).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
          
          console.log(`${time} │ ${trader.piece} │ ~${estimatedContracts} contracts @ ${trade.price.toFixed(3)} │ $${amountUSD.toFixed(2)}`);
        });
        
        console.log(`\nBTC Summary: ${btcData.length} trades, ${new Set(btcData.map(t => t.profile.account)).size} traders\n`);
      }

      // Analyze DOGE market (with actual contracts)
      console.log('🐕 DOGE MARKET ANALYSIS (Actual contract data)');
      console.log('═'.repeat(75));
      
      const response = await fetch('https://api.limitless.exchange/markets/dollardoge-above-dollar024072-on-aug-13-1600-utc-1755097212172');
      const marketData = await response.json();
      
      if (!marketData.feedEvents || marketData.feedEvents.length === 0) {
        console.log('⚠️ No DOGE feed events found');
        return;
      }

      const trades = marketData.feedEvents
        .filter(event => event.eventType === 'NEW_TRADE')
        .map(event => this.convertFeedEventToTrade(event))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const notation = this.createContractsChessNotation(trades);

      console.log('\n' + '═'.repeat(75));
      console.log('♟️ DOGE CHESS NOTATION (Contracts-Based)');
      console.log('═'.repeat(75));
      
      // Show first 10 and last 10 moves for brevity
      const notationToShow = notation.length > 20 ? 
        [...notation.slice(0, 10), '...', ...notation.slice(-10)] : 
        notation;
        
      notationToShow.forEach(move => {
        console.log(move);
      });

      // Contract statistics
      this.displayContractStatistics(trades, marketData);

      return { trades, notation, marketData };

    } catch (error) {
      console.error('❌ Error analyzing markets:', error.message);
      throw error;
    }
  }

  // Display contract-focused statistics
  displayContractStatistics(trades, marketData) {
    console.log('\n' + '═'.repeat(75));
    console.log('📊 CONTRACT POSITION ANALYSIS');
    console.log('═'.repeat(75));

    // Calculate total contracts traded
    const totalContracts = trades.reduce((sum, trade) => sum + parseFloat(trade.contracts), 0);
    const totalVolume = parseFloat(marketData.volumeFormatted);

    // Find largest contract positions
    const sortedByContracts = trades.sort((a, b) => parseFloat(b.contracts) - parseFloat(a.contracts));

    console.log(`\n💰 VOLUME STATS:`);
    console.log(`Total Contracts Traded: ${totalContracts.toLocaleString()} contracts`);
    console.log(`Total USD Volume: $${totalVolume.toLocaleString()}`);
    console.log(`Average Price per Contract: $${(totalVolume / totalContracts).toFixed(4)}`);

    console.log(`\n🏆 LARGEST POSITIONS:`);
    sortedByContracts.slice(0, 5).forEach((trade, index) => {
      const trader = this.traders.get(trade.profile.account);
      const contracts = parseFloat(trade.contracts);
      const percentage = (contracts / totalContracts * 100).toFixed(2);
      
      console.log(`${index + 1}. ${trader?.piece || '?'} ${trade.displayName}`);
      console.log(`   ${this.formatContracts(trade.contracts)} contracts (${percentage}%) │ ${trade.outcome} @ ${trade.price.toFixed(3)} │ $${parseFloat(trade.tradeAmountUSD).toFixed(2)}`);
    });

    // Player rankings by total contracts
    const playerContracts = new Map();
    trades.forEach(trade => {
      const account = trade.profile.account;
      const contracts = parseFloat(trade.contracts);
      playerContracts.set(account, (playerContracts.get(account) || 0) + contracts);
    });

    const sortedPlayers = Array.from(playerContracts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log(`\n👑 TOP TRADERS BY TOTAL CONTRACTS:`);
    sortedPlayers.forEach(([account, totalContracts], index) => {
      const trader = this.traders.get(account);
      const percentage = (totalContracts / totalContracts * 100).toFixed(2);
      
      console.log(`${index + 1}. ${trader?.piece || '?'} ${trader?.displayName || account.slice(0, 10) + '...'}`);
      console.log(`   ${this.formatContracts(totalContracts.toString())} total contracts │ ${trader?.trades || 0} trades`);
    });

    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`Target: $0.24072 │ Actual: $${marketData.metadata?.resolvePrice?.toFixed(6) || 'N/A'}`);
    console.log(`Market Resolution: ${marketData.metadata?.resolvePrice > 0.24072 ? '✅ YES WINS' : '❌ NO WINS'}`);
  }
}

// Main execution
async function main() {
  const analyzer = new ContractsChessAnalyzer();
  
  try {
    await analyzer.analyzeBothMarketsWithContracts();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ContractsChessAnalyzer };