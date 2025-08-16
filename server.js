const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Add JSON middleware
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Main route - serve the dynamic chart
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dynamic-chart.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        app: 'DOGE Trading Visualization',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Demo routes for different chart versions
app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'dynamic-chart.html'));
});

app.get('/legacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'working-arrow-chart.html'));
});

app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'legacy/debug-time-chart.html'));
});

app.get('/legacy-old', (req, res) => {
    res.sendFile(path.join(__dirname, 'legacy/complete-trades-chart.html'));
});

// Proxy API endpoints to avoid CORS issues
app.get('/api/market/:marketId', async (req, res) => {
    try {
        const { marketId } = req.params;
        
        console.log(`📡 Proxying market request: ${marketId}`);
        
        const response = await axios.get(`https://api.limitless.exchange/markets/${marketId}/get-feed-events`, {
            params: { limit: 100 },
            timeout: 15000
        });
        
        // Extract events and format as expected by the client
        const responseData = response.data;
        
        console.log(`Raw events received: ${responseData.events?.length || 0}`);
        
        if (!responseData.events || responseData.events.length === 0) {
            res.json({
                events: [],
                message: 'No trading events found for this market'
            });
            return;
        }
        
        // Transform events to the expected format
        const tradeEvents = responseData.events.filter(event => event.eventType === 'NEW_TRADE');
        console.log(`NEW_TRADE events filtered: ${tradeEvents.length}`);
        
        const events = tradeEvents.map(event => ({
                createdAt: event.timestamp,
                takerAmount: parseFloat(event.data.contracts || 0),
                contracts: parseFloat(event.data.contracts || 0),
                price: parseFloat(event.data.tradeAmountUSD || 0) / parseFloat(event.data.contracts || 1),
                outcome: event.data.outcome,
                strategy: event.data.strategy,
                profile: {
                    displayName: event.user?.displayName || event.user?.username || 'Anonymous',
                    account: event.user?.account,
                    pfpUrl: event.user?.pfpUrl
                },
                txHash: event.data.txHash
            }));
        
        res.json({
            events: events,
            totalRows: events.length,
            limit: events.length,
            page: 1,
            totalPages: 1
        });
        
    } catch (error) {
        console.error('❌ Market API Error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Market data unavailable',
            message: error.message,
            status: error.response?.status || 500
        });
    }
});

app.get('/api/pyth/latest/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;
        
        console.log(`💰 Proxying Pyth price request: ${assetId}`);
        
        const response = await axios.get(`https://hermes.pyth.network/v2/updates/price/latest`, {
            params: { 'ids[]': assetId },
            timeout: 10000
        });
        
        if (!response.data.parsed || response.data.parsed.length === 0) {
            throw new Error('No price data found');
        }
        
        const priceData = response.data.parsed[0];
        const price = priceData.price;
        const expo = price.expo;
        const priceValue = parseInt(price.price) * Math.pow(10, expo);
        
        const parsedPrice = {
            price: Math.max(0, priceValue),
            confidence: parseInt(price.conf) * Math.pow(10, expo),
            publishTime: new Date(price.publish_time * 1000),
            priceId: priceData.id,
            expo: expo
        };
        
        res.json(parsedPrice);
    } catch (error) {
        console.error('❌ Pyth API Error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Price data unavailable',
            message: error.message,
            status: error.response?.status || 500
        });
    }
});

// Original API endpoint for chart data
app.get('/api/data', (req, res) => {
    res.json({
        message: 'Dynamic Trading Data API',
        charts: [
            { name: 'Main Chart', url: '/', description: 'Dynamic chart with real API integration' },
            { name: 'Debug Chart', url: '/debug', description: 'Debug version for development' },
            { name: 'Legacy Chart', url: '/legacy', description: 'Previous chart implementation' }
        ],
        features: [
            'Dynamic market switching',
            'Real-time API integration',
            'Limitless Exchange & Pyth Network data',
            'Error handling and graceful degradation',
            'URL parameter configuration'
        ],
        endpoints: [
            { path: '/api/market/:marketId', description: 'Get market trading events' },
            { path: '/api/pyth/latest/:assetId', description: 'Get latest price from Pyth Network' }
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'working-arrow-chart.html'));
});

app.listen(port, () => {
    console.log(`🚀 DOGE Trading Visualization server running at http://localhost:${port}`);
    console.log(`📊 Main chart available at: http://localhost:${port}/`);
    console.log(`🔍 Debug chart available at: http://localhost:${port}/debug`);
    console.log(`🏛️  Legacy chart available at: http://localhost:${port}/legacy`);
    console.log(`💾 API data available at: http://localhost:${port}/api/data`);
});