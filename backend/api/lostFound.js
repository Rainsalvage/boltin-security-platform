// API routes for Lost & Found functionality
const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Report a gadget as lost
router.post('/report-lost', (req, res) => {
    try {
        const { serialNumber, userId } = req.body;
        
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
        
        // Check if the user is the owner of the gadget
        if (gadget.ownerId && gadget.ownerId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to report this gadget as lost'
            });
        }
        
        // Mark gadget as lost
        const updatedGadget = db.gadgets.update(serialNumber, {
            isLost: true,
            lostDate: new Date().toISOString()
        });
        
        // Create notification for owner if different user
        let notification = null;
        if (req.user && req.user.id !== gadget.ownerId) {
            notification = {
                type: 'gadget-reported-lost',
                message: `A gadget with serial number ${serialNumber} has been reported as lost`,
                recipient: gadget.ownerId,
                timestamp: new Date().toISOString()
            };
            
            db.notifications.create(notification);
            
            // In a real app, we would send an email/SMS here
            console.log(`Notification sent to user ${gadget.ownerId}: ${notification.message}`);
        }
        
        // Create admin notification
        const adminNotification = {
            type: 'admin-gadget-reported-lost',
            message: `A gadget with serial number ${serialNumber} has been reported as lost`,
            timestamp: new Date().toISOString()
        };
        
        db.adminNotifications.create(adminNotification);
        
        res.json({
            success: true,
            message: 'Gadget marked as lost',
            data: updatedGadget,
            notification: notification,
            adminNotification: adminNotification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking gadget as lost',
            error: error.message
        });
    }
});

// Check if a gadget is lost
router.get('/check/:serialNumber', (req, res) => {
    try {
        const { serialNumber } = req.params;
        
        const gadget = db.gadgets.getBySerial(serialNumber);
        
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
            message: 'Error checking gadget status',
            error: error.message
        });
    }
});

module.exports = router;