# 🚂 Railway Deployment Guide

## Method 1: One-Click Deployment (Recommended)

1. **Visit Railway**: Go to [railway.app](https://railway.app)
2. **Sign Up/Login**: Use your GitHub account
3. **Deploy from GitHub**: 
   - Click "Deploy from GitHub repo"
   - Select `horshkov/doge-trading-visualization`
   - Railway will automatically detect and deploy using our configuration

## Method 2: Railway CLI

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Initialize and Deploy**:
```bash
railway init
railway up
```

## Method 3: Manual GitHub Integration

1. **Create New Project** on Railway dashboard
2. **Connect GitHub Repository**: `horshkov/doge-trading-visualization`
3. **Deploy**: Railway will automatically build and deploy

## 🔧 Configuration Details

Our project includes these Railway-specific files:

### `railway.json`
- **Build Command**: `npm install`
- **Start Command**: `npm start` 
- **Health Check**: `/health` endpoint
- **Auto-restart**: On failure with max 10 retries

### `server.js`
- **Express Server**: Serves static files and provides routing
- **Environment Variables**: Supports `PORT` from Railway
- **Multiple Routes**: Main chart, debug, legacy, and API endpoints

### `package.json`
- **Start Script**: `node server.js`
- **Engine Requirements**: Node.js >=14.0.0
- **Dependencies**: Express for serving, Axios for data fetching

## 🌐 Expected Deployment URL

After deployment, your app will be available at:
```
https://your-app-name.up.railway.app
```

## 📊 Available Endpoints

- `/` - Main Apple-style DOGE trading visualization
- `/debug` - Debug chart for development testing
- `/legacy` - Previous chart implementations  
- `/api/data` - JSON metadata about charts and features
- `/health` - Health check for monitoring (returns JSON status)

## 🚀 Post-Deployment

1. **Update README**: Replace placeholder URL with actual deployment URL
2. **Test Endpoints**: Verify all routes work correctly
3. **Monitor Health**: Check `/health` endpoint responds properly
4. **Performance**: Monitor Railway dashboard for metrics

## 🐛 Troubleshooting

### Common Issues:
- **Build Fails**: Check Node.js version compatibility
- **Static Assets Not Loading**: Verify file paths in HTML
- **Port Issues**: Railway automatically assigns PORT environment variable

### Debug Steps:
1. Check Railway deployment logs
2. Test locally with `npm start`
3. Verify all file paths are correct
4. Check health endpoint: `/health`

## 💡 Tips

- **Custom Domain**: Add your own domain in Railway settings
- **Environment Variables**: Set any needed vars in Railway dashboard  
- **Monitoring**: Railway provides built-in metrics and logging
- **Auto-Deploy**: Pushes to main branch will trigger redeployment

## 🎯 Success Checklist

- [ ] Repository connected to Railway
- [ ] Build completes successfully
- [ ] Health check endpoint responds
- [ ] Main chart loads and displays correctly
- [ ] Time navigation controls work
- [ ] All trade arrows are visible
- [ ] Responsive design works on mobile
- [ ] API endpoint returns proper JSON