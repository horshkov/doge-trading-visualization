const { EnhancedPythIntegration } = require('./scripts/enhanced-pyth-integration.js');
const axios = require('axios');

class ChartTester {
    constructor() {
        this.pythIntegration = new EnhancedPythIntegration();
        this.limitlessApi = axios.create({
            baseURL: 'https://api.limitless.exchange',
            timeout: 15000
        });
    }

    // Test configurations with different markets
    static TEST_CONFIGS = [
        {
            name: 'DOGE Market (Original)',
            marketId: 'dollarbtc-above-dollar12029350-on-aug-13-1400-utc-1755090024498',
            pythAssetId: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
            targetPrice: 0.24072
        },
        {
            name: 'BTC Market Test',
            marketId: 'dollarbtc-above-dollar100000-test',
            pythAssetId: 'BTC', // Will be converted to actual ID
            targetPrice: 100000
        },
        {
            name: 'ETH Market Test', 
            marketId: 'dollareth-above-dollar4000-test',
            pythAssetId: 'ETH', // Will be converted to actual ID
            targetPrice: 4000
        }
    ];

    async testMarketAccess(config) {
        console.log(`\n🧪 Testing: ${config.name}`);
        console.log('─'.repeat(50));
        
        const results = {
            marketAccess: false,
            pythAccess: false,
            hasTradeData: false,
            priceDataAvailable: false,
            errors: []
        };

        try {
            // Test 1: Market API Access
            console.log('📡 Testing market API access...');
            try {
                const response = await this.limitlessApi.get(`/markets/${config.marketId}/events?limit=10`);
                results.marketAccess = true;
                results.hasTradeData = response.data.events && response.data.events.length > 0;
                console.log(`   ✅ Market API: ${response.status} - ${response.data.events?.length || 0} events found`);
            } catch (error) {
                results.errors.push(`Market API: ${error.response?.status} ${error.message}`);
                console.log(`   ❌ Market API: ${error.response?.status || 'ERROR'} - ${error.message}`);
            }

            // Test 2: Pyth API Access
            console.log('💰 Testing Pyth Network access...');
            try {
                const priceData = await this.pythIntegration.getLatestPrice(config.pythAssetId);
                results.pythAccess = true;
                results.priceDataAvailable = true;
                console.log(`   ✅ Pyth API: Latest price $${priceData.price.toFixed(6)} at ${priceData.publishTime.toISOString()}`);
            } catch (error) {
                results.errors.push(`Pyth API: ${error.message}`);
                console.log(`   ❌ Pyth API: ${error.message}`);
            }

            // Test 3: Chart URL Generation
            const chartUrl = this.generateChartUrl(config);
            console.log(`🔗 Chart URL: http://localhost:3000/?${chartUrl}`);

            // Test 4: Overall Status
            const overallSuccess = results.marketAccess || results.pythAccess;
            console.log(`📊 Overall Status: ${overallSuccess ? '✅ WORKING' : '❌ FAILED'}`);
            
            if (results.errors.length > 0) {
                console.log(`⚠️  Issues: ${results.errors.length}`);
                results.errors.forEach(error => console.log(`   • ${error}`));
            }

        } catch (error) {
            console.error(`💥 Unexpected error: ${error.message}`);
            results.errors.push(`Unexpected: ${error.message}`);
        }

        return results;
    }

    generateChartUrl(config) {
        const params = new URLSearchParams({
            marketId: config.marketId,
            pythId: config.pythAssetId,
            target: config.targetPrice.toString()
        });
        return params.toString();
    }

    async testAllConfigurations() {
        console.log('🚀 DYNAMIC CHART CONFIGURATION TESTER');
        console.log('═'.repeat(70));
        
        const allResults = {};
        let successCount = 0;

        for (const config of ChartTester.TEST_CONFIGS) {
            const results = await this.testMarketAccess(config);
            allResults[config.name] = results;
            
            if (results.marketAccess || results.pythAccess) {
                successCount++;
            }

            // Add delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Summary Report
        console.log('\n📋 SUMMARY REPORT');
        console.log('═'.repeat(70));
        console.log(`Total Configurations Tested: ${ChartTester.TEST_CONFIGS.length}`);
        console.log(`Working Configurations: ${successCount}`);
        console.log(`Success Rate: ${(successCount / ChartTester.TEST_CONFIGS.length * 100).toFixed(1)}%`);

        console.log('\n🎯 WORKING CHART URLS:');
        for (const [name, results] of Object.entries(allResults)) {
            if (results.marketAccess || results.pythAccess) {
                const config = ChartTester.TEST_CONFIGS.find(c => c.name === name);
                const url = `http://localhost:3000/?${this.generateChartUrl(config)}`;
                console.log(`   ${name}: ${url}`);
            }
        }

        console.log('\n💡 RECOMMENDATIONS:');
        
        // Check if original DOGE market is working
        const dogeResults = allResults['DOGE Market (Original)'];
        if (dogeResults && dogeResults.marketAccess && dogeResults.pythAccess) {
            console.log('   ✅ Original DOGE market is fully functional - recommended for testing');
        } else if (dogeResults && dogeResults.pythAccess) {
            console.log('   ⚠️  DOGE market has no trade data, but Pyth prices work - chart will show generated data');
        }

        // Check Pyth integration
        const workingPythConfigs = Object.entries(allResults).filter(([_, r]) => r.pythAccess);
        if (workingPythConfigs.length > 0) {
            console.log(`   ✅ Pyth Network integration working for ${workingPythConfigs.length} assets`);
        }

        // Error analysis
        const allErrors = Object.values(allResults).flatMap(r => r.errors);
        const uniqueErrors = [...new Set(allErrors)];
        if (uniqueErrors.length > 0) {
            console.log('\n⚠️  COMMON ISSUES:');
            uniqueErrors.forEach(error => console.log(`   • ${error}`));
        }

        return allResults;
    }

    async testSpecificMarket(marketId, pythAssetId, targetPrice) {
        const config = {
            name: 'Custom Test',
            marketId,
            pythAssetId,
            targetPrice
        };
        
        return await this.testMarketAccess(config);
    }
}

// Main execution
async function main() {
    const tester = new ChartTester();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length >= 3) {
        // Test specific market
        const [marketId, pythAssetId, targetPrice] = args;
        console.log('🎯 Testing specific market configuration...');
        await tester.testSpecificMarket(marketId, pythAssetId, parseFloat(targetPrice));
    } else {
        // Test all predefined configurations
        await tester.testAllConfigurations();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { ChartTester };