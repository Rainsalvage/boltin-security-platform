// API routes for Admin Panel
const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Get dashboard stats
router.get('/dashboard-stats', (req, res) => {
    try {
        const stats = {
            totalGadgets: db.gadgets.getAll().length,
            totalUsers: db.users.getAll().length,
            totalLostGadgets: db.gadgets.getLost().length,
            totalFlaggedGadgets: db.gadgets.getFlagged().length,
            chatbotUsage: db.chatbotConversations.getAll().length,
            totalNotifications: db.notifications.getAll().length
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
});

// Get all registered gadgets
router.get('/gadgets', (req, res) => {
    try {
        const gadgets = db.gadgets.getAll();
        
        res.json({
            success: true,
            data: gadgets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching gadgets',
            error: error.message
        });
    }
});

// Get all users
router.get('/users', (req, res) => {
    try {
        const users = db.users.getAll();
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// Get lost and flagged gadgets
router.get('/lost-gadgets', (req, res) => {
    try {
        const lostGadgets = db.gadgets.getLost();
        
        res.json({
            success: true,
            data: lostGadgets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lost gadgets',
            error: error.message
        });
    }
});

// Get chatbot conversation logs
router.get('/chatbot-logs', (req, res) => {
    try {
        const logs = db.chatbotConversations.getAll();
        
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching chatbot logs',
            error: error.message
        });
    }
});

// Get sentiment analysis (mock implementation)
router.get('/sentiment-analysis', (req, res) => {
    try {
        // In a real app, this would be actual sentiment analysis
        // For now, we'll provide some mock data
        const logs = db.chatbotConversations.getAll();
        
        // Simple sentiment analysis based on message content
        const sentiment = {
            positive: 0,
            negative: 0,
            neutral: 0,
            total: logs.length
        };
        
        logs.forEach(log => {
            const userMessage = log.userMessage.toLowerCase();
            const botResponse = log.botResponse.toLowerCase();
            
            if (userMessage.includes('thank') || botResponse.includes('thank') || 
                userMessage.includes('good') || botResponse.includes('good') ||
                userMessage.includes('great') || botResponse.includes('great')) {
                sentiment.positive++;
            } else if (userMessage.includes('problem') || botResponse.includes('problem') ||
                     userMessage.includes('not working') || botResponse.includes('not working') ||
                     userMessage.includes('error') || botResponse.includes('error')) {
                sentiment.negative++;
            } else {
                sentiment.neutral++;
            }
        });
        
        res.json({
            success: true,
            data: sentiment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sentiment analysis',
            error: error.message
        });
    }
});

module.exports = router;