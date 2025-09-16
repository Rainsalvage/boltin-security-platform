// Node.js server for Boltin App
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock database connection
const db = require('./utils/db');

// API routes
const gadgetRoutes = require('./api/gadgets');
const userRoutes = require('./api/users');
const lostFoundRoutes = require('./api/lostFound');
const chatbotRoutes = require('./api/chatbot');

// Use API routes
app.use('/api/gadgets', gadgetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Main route to serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});