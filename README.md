# 🐕 DOGE Trading Visualization

An advanced high-frequency trading visualization tool for analyzing DOGE prediction market data from Limitless Exchange with Apple-style UI design.

![DOGE Trading Chart](./demo-screenshot.png)

## ✨ Features

### 🚀 High-Frequency Analysis
- **5-Second Resolution**: 721 price data points with micro-fluctuations
- **Dual Resolution System**: 1-minute for overview, 5-second for detailed analysis
- **Multi-Timeframe Views**: 1 Hour, 30 Minutes, and 5 Minutes
- **88 Trades Mapped**: All trading events positioned precisely on price curve

### 🎯 Interactive Visualization
- **Directional Arrows**: Color-coded trade indicators (↑↓)
  - 🟢 **Green ↑**: BUY YES trades
  - 🔴 **Red ↑**: SELL YES trades  
  - 🟢 **Green ↓**: BUY NO trades
  - 🔴 **Red ↓**: SELL NO trades
- **Smart Navigation**: Navigate through time periods with responsive controls
- **Dynamic Scaling**: Y-axis automatically adjusts for optimal detail
- **Precision Tooltips**: Detailed trade information on hover

### 🍎 Apple-Style Design
- **Glassmorphism UI**: Frosted glass backdrop blur effects
- **SF Pro Typography**: Official Apple system fonts
- **Premium Animations**: Smooth micro-interactions
- **Apple Color Palette**: Authentic iOS/macOS colors

## 📊 Technical Specifications

### Data Sources
- **Trading Data**: Limitless Exchange API
- **Price Data**: Pyth Network Oracle (5-second interpolation)
- **Market**: DOGE > $0.24072 on Aug 13, 2025

### Architecture
- **Frontend**: Pure HTML5 + Chart.js
- **Data Processing**: Custom interpolation algorithms
- **Resolution**: Adaptive (1-minute ↔ 5-second)
- **Performance**: Optimized for 3,600+ data points

### Key Metrics
- **Total Volume**: 2,386.03 contracts
- **Total Trades**: 88 trading events
- **Price Range**: $0.241377 - $0.242606
- **Result**: YES (DOGE stayed above target)

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/doge-trading-visualization.git
cd doge-trading-visualization
```

2. Open the main visualization:
```bash
open working-arrow-chart.html
```

3. Use time controls to navigate:
   - **1 Hour**: Full overview with 1-minute resolution
   - **30 Minutes**: Detailed view with 1-minute resolution  
   - **5 Minutes**: Ultra-detailed view with 5-second resolution

## 🗂️ Project Structure

```
limitless-trading-project/
├── working-arrow-chart.html         # 🎯 Main Apple-style visualization
├── data/
│   ├── doge-market-data.json       # Raw trading events data
│   ├── enhanced-doge-chart-data.json # Processed chart data
│   └── doge-trading-readable.json   # Human-readable format
├── scripts/
│   ├── market-data-collector.js     # API data collector
│   ├── pyth-price-analyzer.js      # Price data processor
│   └── readable-format-analyzer.js  # Data formatter
├── legacy/
│   ├── debug-time-chart.html       # Debug chart for development
│   ├── complete-trades-chart.html   # Previous versions
│   └── enhanced-doge-price-chart.html
└── README.md
```

## 🛠️ Development

### Chart Features
- **Custom Arrow Plugin**: Hand-built Chart.js plugin for directional indicators
- **Time-based Filtering**: Dynamic data filtering by time windows
- **Interpolation Engine**: Smooth price curves between known points
- **Responsive Design**: Works on all screen sizes

### Data Processing Pipeline
1. **Collection**: Fetch all trading events from Limitless API
2. **Enhancement**: Add readable trader names and contract sizes
3. **Price Matching**: Map trades to interpolated price data
4. **Visualization**: Render with Chart.js + custom plugins

### Performance Optimizations
- **Smart Data Selection**: Only load necessary resolution data
- **Efficient Filtering**: Time-based data windowing
- **Smooth Animations**: 60fps interactions with CSS transforms
- **Memory Management**: Cleanup unused datasets

## 🎨 Design Philosophy

This project follows Apple's Human Interface Guidelines:
- **Clarity**: Information hierarchy through typography and spacing
- **Deference**: Content-first approach with subtle UI elements  
- **Depth**: Layered interface using shadows and blur effects

### Color System
- **Primary**: `#007aff` (Apple Blue)
- **Success**: `#30d158` (Apple Green)  
- **Danger**: `#ff3b30` (Apple Red)
- **Warning**: `#ff9500` (Apple Orange)
- **Text**: `#1d1d1f` / `#86868b` (Apple Grays)

## 📈 Future Enhancements

- [ ] Real-time data streaming
- [ ] Multiple market support
- [ ] Advanced filtering options
- [ ] Export functionality (PNG/PDF)
- [ ] Mobile-optimized interface
- [ ] Dark mode support
- [ ] Historical data comparison

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Limitless Exchange** for providing trading data API
- **Pyth Network** for reliable price oracle data
- **Chart.js** for powerful visualization framework
- **Apple** for design inspiration and guidelines

---

Built with ❤️ and precision trading analysis