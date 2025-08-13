const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Main route - serve the Apple-style visualization
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'working-arrow-chart.html'));
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
    res.sendFile(path.join(__dirname, 'working-arrow-chart.html'));
});

app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'legacy/debug-time-chart.html'));
});

app.get('/legacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'legacy/complete-trades-chart.html'));
});

// API endpoint for chart data
app.get('/api/data', (req, res) => {
    res.json({
        message: 'DOGE Trading Data API',
        charts: [
            { name: 'Main Chart', url: '/', description: 'Apple-style high-frequency visualization' },
            { name: 'Debug Chart', url: '/debug', description: 'Debug version for development' },
            { name: 'Legacy Chart', url: '/legacy', description: 'Previous chart implementation' }
        ],
        features: [
            '5-second resolution trading data',
            'Apple-style glassmorphism UI',
            'Interactive time navigation',
            'Dual-resolution system',
            '88 trading events mapped'
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