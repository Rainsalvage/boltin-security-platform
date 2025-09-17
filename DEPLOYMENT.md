# Boltin Security Platform Deployment Guide

## 🚀 Deployment Options

### Railway (Recommended)
1. Visit [railway.app](https://railway.app)
2. Connect your GitHub account (adenlebobola)
3. Deploy from `boltin-security-platform` repository
4. Railway auto-configures everything!

### Render
1. Visit [render.com](https://render.com)
2. Connect GitHub and select repository
3. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Vercel
1. Visit [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Configure as Node.js project

## 🔧 Environment Variables
Set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=3000` (Railway auto-sets this)

## 📁 File Structure
- All uploads will be stored in `/tmp` on serverless platforms
- Database files will persist on Railway/Render
- For production, consider upgrading to MongoDB/PostgreSQL

## 🌐 Domain Setup
- **Free domains**: .railway.app, .onrender.com, .vercel.app
- **Custom domain**: Add after deployment (most platforms support this)

## 📊 Monitoring
- Railway: Built-in metrics and logs
- Render: Logs and basic monitoring
- Vercel: Analytics dashboard

## 🔒 Security Notes
- HTTPS is automatically enabled
- All platforms provide SSL certificates
- Environment variables are encrypted