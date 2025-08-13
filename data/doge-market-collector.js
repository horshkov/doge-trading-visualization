const { MarketDataCollector } = require('./market-data-collector');
const { ChessNotationAnalyzer } = require('./chess-notation-analyzer');

async function main() {
  // Extract market ID from the DOGE URL
  const dogeMarketId = 'dollardoge-above-dollar024072-on-aug-13-1600-utc-1755097212172';
  
  console.log('🐕 Analyzing DOGE Market: $DOGE above $0.24072 on Aug 13, 16:00 UTC');
  console.log('═'.repeat(70));
  console.log();

  try {
    // Step 1: Collect market data
    console.log('📊 Step 1: Collecting DOGE market trading data...');
    const collector = new MarketDataCollector();
    const data = await collector.collectMarketData(dogeMarketId);
    
    if (data.length === 0) {
      console.log('⚠️ No trading data found for this DOGE market');
      return;
    }

    console.log(`✅ Collected ${data.length} trades from DOGE market\n`);

    // Step 2: Generate chess notation
    console.log('♟️ Step 2: Converting to chess notation...');
    const analyzer = new ChessNotationAnalyzer();
    
    // Find the most recent DOGE market data file
    const fs = require('fs').promises;
    const files = await fs.readdir('.');
    const dogeFile = files.find(file => 
      file.includes('dollardoge-above-dollar024072') && file.endsWith('.json')
    );

    if (dogeFile) {
      await analyzer.analyzeMarketAsChess(dogeFile);
    }

    console.log('\n🎯 DOGE market analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing DOGE market:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };