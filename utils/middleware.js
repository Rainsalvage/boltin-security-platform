const multer = require('multer');
const express = require('express');
const multerPackage = require('multer');
const pathLib = require('path');
const fsPromises = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const jwtLib = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'boltin-super-secret-key-2025';

// Configure multer for file uploads
const storage = multerPackage.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/images';
        try {
            await fsPromises.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${pathLib.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multerPackage({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
        files: 10 // Maximum 10 files
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multerPackage.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'File size cannot exceed 5MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 10 files allowed'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field',
                message: 'Unexpected file field'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            error: 'Invalid file type',
            message: error.message
        });
    }

    next(error);
};

// Async wrapper for route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token is required'
        });
    }

    jwtLib.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Authentication middleware (simplified for demo)
const authenticate = async (req, res, next) => {
    // For demo purposes, we'll skip authentication
    // In production, implement proper JWT authentication
    next();
};

// Logging middleware
const logRequest = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
};

// Clean up uploaded files on error
const cleanupFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        try {
            await fsPromises.unlink(file.path);
        } catch (error) {
            console.error(`Error deleting file ${file.path}:`, error);
        }
    }
};

// Response helpers
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const sendError = (res, message = 'Internal server error', statusCode = 500, details = null) => {
    res.status(statusCode).json({
        success: false,
        error: message,
        details,
        timestamp: new Date().toISOString()
    });
};

// Device status helper
const getDeviceStatus = (device, reports) => {
    const deviceReports = reports.filter(report => 
        report.serialNumber === device.serialNumber
    );
    
    if (deviceReports.length === 0) {
        return {
            status: 'safe',
            message: 'This device is registered and has no reports against it.',
            color: 'success'
        };
    }

    const latestReport = deviceReports.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    // Handle different report types
    let message, color;
    switch (latestReport.reportType) {
        case 'stolen':
            message = 'WARNING: This device has been reported as STOLEN!';
            color = 'danger';
            break;
        case 'lost':
            message = 'This device has been reported as lost.';
            color = 'warning';
            break;
        case 'missing':
            message = 'This device has been reported as missing.';
            color = 'info';
            break;
        case 'found':
            message = 'This device has been found and is awaiting pickup.';
            color = 'primary';
            break;
        default:
            message = 'This device has an active report.';
            color = 'secondary';
    }

    return {
        status: latestReport.reportType,
        message,
        color,
        reportDate: latestReport.incidentDate || latestReport.foundDate,
        location: latestReport.location || latestReport.foundLocation
    };
};

// Generate device statistics
const generateStats = async (devicesDB, reportsDB) => {
    const devices = await devicesDB.read();
    const reports = await reportsDB.read();
    
    const totalDevices = devices.length;
    const stolenDevices = reports.filter(r => r.reportType === 'stolen' && r.status === 'active').length;
    const lostDevices = reports.filter(r => r.reportType === 'lost' && r.status === 'active').length;
    const missingDevices = reports.filter(r => r.reportType === 'missing' && r.status === 'active').length;
    const foundDevices = reports.filter(r => r.reportType === 'found' && r.status === 'pending_pickup').length;
    const totalReported = stolenDevices + lostDevices + missingDevices;
    const safeDevices = totalDevices - totalReported;
    
    return {
        totalDevices,
        safeDevices,
        stolenDevices,
        lostDevices,
        missingDevices,
        foundDevices,
        totalReported,
        recoveryRate: totalDevices > 0 ? Math.round((safeDevices / totalDevices) * 100) : 0
    };
};

module.exports = {
    upload,
    handleMulterError,
    asyncHandler,
    authenticate,
    authenticateToken,
    logRequest,
    cleanupFiles,
    sendSuccess,
    sendError,
    getDeviceStatus,
    generateStats
};