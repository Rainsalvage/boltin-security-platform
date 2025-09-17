@echo off
echo 🚀 Starting Boltin Security Platform...
echo.
echo 📦 Installing dependencies...
call npm install
echo.
echo 🌐 Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
node server.js