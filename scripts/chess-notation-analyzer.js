const fs = require('fs').promises;

class ChessNotationAnalyzer {
  constructor() {
    this.traders = new Map();
    this.moveCounter = 1;
  }

  // Convert wei amounts to readable format
  formatAmount(amountWei) {
    const amount = parseInt(amountWei) / 1000000; // Convert to USDC (6 decimals)
    return amount.toFixed(2);
  }

  // Get or assign a chess piece to trader
  getTraderPiece(profile) {
    const address = profile.account;
    const displayName = profile.displayName || profile.username || address;
    
    if (!this.traders.has(address)) {
      const pieceIndex = this.traders.size;
      const pieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];
      const piece = pieces[pieceIndex % pieces.length];
      
      this.traders.set(address, {
        piece,
        displayName,
        rank: profile.rankName,
        points: parseFloat(profile.points || '0'),
        position: profile.leaderboardPosition,
        trades: 0
      });
    }
    
    this.traders.get(address).trades++;
    return this.traders.get(address);
  }

  // Format price with direction indicator
  formatPrice(price) {
    if (price >= 0.8) return `${price}↗️`; // High confidence YES
    if (price >= 0.6) return `${price}➡️`; // Moderate YES
    if (price >= 0.4) return `${price}➡️`; // Neutral
    if (price >= 0.2) return `${price}↘️`; // Moderate NO
    return `${price}↘️`; // High confidence NO
  }

  // Determine move type based on price
  getMoveType(price) {
    if (price >= 0.8) return 'YES++'; // Strong YES bet
    if (price >= 0.6) return 'YES+';  // Moderate YES bet
    if (price >= 0.4) return 'YES';   // Weak YES bet
    if (price >= 0.2) return 'NO';    // Weak NO bet
    return 'NO++';                    // Strong NO bet
  }

  // Create chess notation for trades
  createChessNotation(trades) {
    console.log('♟️ BTC Market Trading Game: $120,293.50 Prediction ♟️');
    console.log('═'.repeat(60));
    console.log();

    let notation = [];
    let currentPair = '';

    trades.forEach((trade, index) => {
      const trader = this.getTraderPiece(trade.profile);
      const amount = this.formatAmount(trade.takerAmount);
      const price = this.formatPrice(trade.price);
      const moveType = this.getMoveType(trade.price);
      const time = new Date(trade.createdAt).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      // Create move notation: Piece + MoveType + Amount @ Price
      const move = `${trader.piece}${moveType}$${amount}@${price}`;
      
      if (index % 2 === 0) {
        // White move (even index)
        currentPair = `${this.moveCounter}.${move}`;
      } else {
        // Black move (odd index)
        currentPair += ` ${move}`;
        notation.push(currentPair);
        this.moveCounter++;
      }

      // If last move and odd number of moves
      if (index === trades.length - 1 && index % 2 === 0) {
        notation.push(currentPair);
      }

      console.log(`${time} │ ${trader.piece} ${trader.displayName} │ ${moveType} $${amount} @ ${trade.price} │ Rank: ${trader.rank}`);
    });

    return notation;
  }

  // Display final game summary
  displayGameSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('🏆 FINAL GAME SUMMARY');
    console.log('═'.repeat(60));

    // Sort traders by number of trades
    const sortedTraders = Array.from(this.traders.entries())
      .sort(([,a], [,b]) => b.trades - a.trades);

    console.log('\n👥 PLAYERS ROSTER:');
    sortedTraders.forEach(([address, trader], index) => {
      const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
      console.log(`${index + 1}. ${trader.piece} ${trader.displayName} (${shortAddress})`);
      console.log(`   Rank: ${trader.rank} | Points: ${trader.points} | Position: #${trader.position} | Moves: ${trader.trades}`);
      console.log();
    });

    // Calculate market sentiment
    let totalVolume = 0;
    let yesVolume = 0;
    const tradeData = Array.from(this.traders.values());
    
    console.log('📊 MARKET SENTIMENT ANALYSIS:');
    console.log(`Total Players: ${this.traders.size}`);
    console.log(`Total Moves: ${this.moveCounter - 1}`);
    console.log(`Game Duration: ~35 minutes`);
    console.log(`Most Active Player: ${sortedTraders[0][1].displayName} (${sortedTraders[0][1].trades} moves)`);
  }

  // Main analysis function
  async analyzeMarketAsChess(filename) {
    try {
      console.log('📚 Loading market data...\n');
      
      const data = await fs.readFile(filename, 'utf8');
      const trades = JSON.parse(data);

      console.log(`🔍 Found ${trades.length} trading moves to analyze\n`);

      // Create chess notation
      const notation = this.createChessNotation(trades);

      console.log('\n' + '═'.repeat(60));
      console.log('♟️ CHESS NOTATION SEQUENCE');
      console.log('═'.repeat(60));
      
      notation.forEach(move => {
        console.log(move);
      });

      // Display summary
      this.displayGameSummary();

      // Save chess notation to file
      const chessFile = filename.replace('.json', '-chess-notation.txt');
      const chessContent = [
        'BTC Market Trading Game: $120,293.50 Prediction',
        '═'.repeat(50),
        '',
        'CHESS NOTATION:',
        ...notation,
        '',
        'LEGEND:',
        '♔♕♖♗♘♙ = Different traders',
        'YES++ = Strong YES bet (price ≥ 0.8)',
        'YES+  = Moderate YES bet (price ≥ 0.6)',
        'YES   = Weak YES bet (price ≥ 0.4)',
        'NO    = Weak NO bet (price ≥ 0.2)',
        'NO++  = Strong NO bet (price < 0.2)',
        '$X.XX = Trade amount in USDC',
        '@X.XX = Execution price',
        '↗️➡️↘️ = Price trend indicators',
      ].join('\n');

      await fs.writeFile(chessFile, chessContent);
      console.log(`\n💾 Chess notation saved to: ${chessFile}`);

      return notation;

    } catch (error) {
      console.error('❌ Error analyzing data:', error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const analyzer = new ChessNotationAnalyzer();
  
  // Find the most recent market data file
  const files = await fs.readdir('.');
  const marketFile = files.find(file => 
    file.startsWith('market-data-dollarbtc') && file.endsWith('.json')
  );

  if (!marketFile) {
    console.error('❌ No market data file found. Please run market-data-collector.js first.');
    return;
  }

  console.log(`🎯 Analyzing market data: ${marketFile}\n`);
  
  try {
    await analyzer.analyzeMarketAsChess(marketFile);
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { ChessNotationAnalyzer };