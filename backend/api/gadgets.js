// API routes for gadget registration
const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Get all gadgets
router.get('/', (req, res) => {
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

// Register a new gadget
router.post('/register', (req, res) => {
    try {
        const { ownerName, contact, deviceType, brand, model, serialNumber, description } = req.body;
        
        // Validate required fields
        if (!ownerName || !contact || !deviceType || !brand || !model || !serialNumber) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Check for duplicate serial number
        const existingGadget = db.gadgets.getBySerial(serialNumber);
        
        if (existingGadget) {
            return res.status(400).json({
                success: false,
                message: 'A gadget with this serial/IMEI number is already registered',
                data: {
                    isLost: existingGadget.isLost
                }
            });
        }
        
        // Register new gadget
        const newGadget = db.gadgets.create({
            ownerName,
            contact,
            deviceType,
            brand,
            model,
            serialNumber,
            description,
            isLost: false,
            createdAt: new Date().toISOString()
        });
        
        res.status(201).json({
            success: true,
            message: 'Gadget registered successfully',
            data: newGadget
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering gadget',
            error: error.message
        });
    }
});

// Mark gadget as lost
router.post('/lost', (req, res) => {
    try {
        const { serialNumber } = req.body;
        
        if (!serialNumber) {
            return res.status(400).json({
                success: false,
                message: 'Serial number is required'
            });
        }
        
        const gadget = db.gadgets.getBySerial(serialNumber);
        
        if (!gadget) {
            return res.status(404).json({
                success: false,
                message: 'Gadget not found'
            });
        }
        
        // Update gadget status to lost
        const updatedGadget = db.gadgets.update(serialNumber, {
            isLost: true,
            lostDate: new Date().toISOString()
        });
        
        // Notify owner if different user
        let notification = null;
        if (req.user && req.user.contact !== gadget.contact) {
            notification = {
                type: 'gadget-reported-lost',
                message: `A gadget with serial number ${serialNumber} has been reported as lost`,
                recipient: gadget.contact,
                timestamp: new Date().toISOString()
            };
            
            db.notifications.create(notification);
            
            // In a real app, we would send an email/SMS here
            console.log(`Notification sent to ${gadget.contact}: ${notification.message}`);
        }
        
        res.json({
            success: true,
            message: 'Gadget marked as lost',
            data: updatedGadget,
            notification: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking gadget as lost',
            error: error.message
        });
    }
});

// Search gadget by serial number
router.get('/search', (req, res) => {
    try {
        const { serial } = req.query;
        
        if (!serial) {
            return res.status(400).json({
                success: false,
                message: 'Serial number is required for search'
            });
        }
        
        const gadget = db.gadgets.getBySerial(serial);
        
        if (!gadget) {
            return res.json({
                success: true,
                status: 'Not Found',
                message: 'No gadget found with this serial number'
            });
        }
        
        res.json({
            success: true,
            status: gadget.isLost ? 'Lost/Flagged' : 'Registered',
            data: {
                ownerName: gadget.ownerName,
                deviceType: gadget.deviceType,
                brand: gadget.brand,
                model: gadget.model,
                isLost: gadget.isLost
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching gadget',
            error: error.message
        });
    }
});

module.exports = router;