const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://boltin-security-platform-production.up.railway.app', 'https://web-production-*-up.railway.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Create necessary directories
async function createDirectories() {
    const dirs = ['data', 'uploads', 'uploads/images'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`✅ Directory ensured: ${dir}`);
        } catch (error) {
            console.error(`❌ Error creating directory ${dir}:`, error);
        }
    }
}

// Initialize data files
async function initializeDataFiles() {
    const dataFiles = [
        { path: 'data/devices.json', defaultData: [] },
        { path: 'data/users.json', defaultData: [] },
        { path: 'data/transfers.json', defaultData: [] },
        { path: 'data/reports.json', defaultData: [] }
    ];

    for (const file of dataFiles) {
        try {
            await fs.access(file.path);
        } catch (error) {
            // File doesn't exist, create it
            try {
                await fs.writeFile(file.path, JSON.stringify(file.defaultData, null, 2));
                console.log(`Created data file: ${file.path}`);
            } catch (writeError) {
                console.error(`Error creating data file ${file.path}:`, writeError);
            }
        }
    }
}

// Static files middleware
app.use(express.static('frontend'));
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/devices', require('./routes/devices'));
app.use('/api/search', require('./routes/search'));
app.use('/api/transfer', require('./routes/transfer'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/chatbot', require('./routes/chatbot'));

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: '🛡️ Boltin Security Platform is running',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        platform: 'Railway/Render optimized'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    if (res.headersSent) {
        return next(error);
    }

    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

// Initialize and start server
async function startServer() {
    try {
        await createDirectories();
        await initializeDataFiles();
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Boltin Security Server running on port ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
            console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⚙️  Optimized for: Railway, Render, Heroku`);
        });

        // Export server for graceful shutdown
        module.exports = server;
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();