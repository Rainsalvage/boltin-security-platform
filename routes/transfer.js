const express = require('express');
const { Router } = require('express');
const router = Router();
const { devicesDB, transfersDB } = require('../utils/database');
const { 
    transferValidationRules, 
    handleValidationErrors, 
    sanitizeTransfer,
    idValidationRules 
} = require('../utils/validators');
const { 
    asyncHandler, 
    sendSuccess, 
    sendError
} = require('../utils/middleware');

// GET /api/transfer - Get all transfers with pagination
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await transfersDB.paginate(page, limit);
    
    sendSuccess(res, {
        transfers: result.items,
        pagination: result.pagination
    });
}));

// GET /api/transfer/:id - Get specific transfer by ID
router.get('/:id', 
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const transfer = await transfersDB.findById(req.params.id);
        
        if (!transfer) {
            return sendError(res, 'Transfer not found', 404);
        }

        sendSuccess(res, { transfer });
    })
);

// POST /api/transfer/verify - Verify device ownership for transfer
router.post('/verify', asyncHandler(async (req, res) => {
    const { serialNumber, currentOwnerContact } = req.body;
    
    if (!serialNumber || !currentOwnerContact) {
        return sendError(res, 'Serial number and current owner contact are required', 400);
    }

    const serialUpper = serialNumber.trim().toUpperCase();
    const device = await devicesDB.findOne({ serialNumber: serialUpper });
    
    if (!device) {
        return sendError(res, 'Device not found in our system', 404);
    }

    // Verify ownership by checking contact
    if (device.contact.toLowerCase() !== currentOwnerContact.toLowerCase()) {
        return sendError(res, 'Contact information does not match device owner', 403);
    }

    // Check if there's already a pending transfer for this device
    const existingTransfer = await transfersDB.findOne({ 
        serialNumber: serialUpper, 
        status: 'pending' 
    });
    
    if (existingTransfer) {
        return sendError(res, 'There is already a pending transfer for this device', 409);
    }

    sendSuccess(res, {
        device: {
            id: device.id,
            deviceType: device.deviceType,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serialNumber,
            ownerName: device.ownerName,
            verified: device.verified
        },
        verified: true
    }, 'Device ownership verified. You can proceed with the transfer.');
}));

// POST /api/transfer - Create a new transfer request
router.post('/',
    transferValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const transferData = sanitizeTransfer(req.body);
        
        // Verify device exists and ownership
        const device = await devicesDB.findOne({ 
            serialNumber: transferData.serialNumber 
        });
        
        if (!device) {
            return sendError(res, 'Device not found in our system', 404);
        }

        // Verify current owner
        if (device.contact.toLowerCase() !== transferData.currentOwnerContact.toLowerCase()) {
            return sendError(res, 'Current owner contact does not match device records', 403);
        }

        // Check for existing pending transfer
        const existingTransfer = await transfersDB.findOne({ 
            serialNumber: transferData.serialNumber, 
            status: 'pending' 
        });
        
        if (existingTransfer) {
            return sendError(res, 'There is already a pending transfer for this device', 409);
        }

        // Create transfer record
        const newTransfer = await transfersDB.create({
            ...transferData,
            deviceId: device.id,
            status: 'pending',
            transferCode: generateTransferCode(),
            requestIP: req.ip
        });

        sendSuccess(res, { 
            transfer: newTransfer 
        }, 'Transfer request created successfully', 201);
    })
);

// POST /api/transfer/:id/complete - Complete a transfer
router.post('/:id/complete',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { agreement } = req.body;
        
        if (!agreement) {
            return sendError(res, 'Transfer agreement confirmation is required', 400);
        }

        const transfer = await transfersDB.findById(req.params.id);
        
        if (!transfer) {
            return sendError(res, 'Transfer not found', 404);
        }

        if (transfer.status !== 'pending') {
            return sendError(res, 'Transfer is not in pending status', 400);
        }

        // Update device ownership
        const device = await devicesDB.findById(transfer.deviceId);
        if (!device) {
            return sendError(res, 'Associated device not found', 404);
        }

        // Update device with new owner information
        const updatedDevice = await devicesDB.update(transfer.deviceId, {
            ownerName: transfer.newOwnerName,
            contact: transfer.newOwnerContact,
            verified: false, // New owner needs to verify
            lastTransferDate: new Date().toISOString()
        });

        // Update transfer status
        const completedTransfer = await transfersDB.update(req.params.id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            agreementConfirmed: true
        });

        sendSuccess(res, {
            transfer: completedTransfer,
            device: updatedDevice
        }, 'Device ownership transferred successfully');
    })
);

// POST /api/transfer/:id/cancel - Cancel a transfer
router.post('/:id/cancel',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { reason } = req.body;
        
        const transfer = await transfersDB.findById(req.params.id);
        
        if (!transfer) {
            return sendError(res, 'Transfer not found', 404);
        }

        if (transfer.status !== 'pending') {
            return sendError(res, 'Can only cancel pending transfers', 400);
        }

        // Update transfer status
        const cancelledTransfer = await transfersDB.update(req.params.id, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancellationReason: reason || 'No reason provided'
        });

        sendSuccess(res, {
            transfer: cancelledTransfer
        }, 'Transfer cancelled successfully');
    })
);

// GET /api/transfer/device/:serial - Get transfer history for a device
router.get('/device/:serial', asyncHandler(async (req, res) => {
    const serialNumber = req.params.serial.toUpperCase();
    
    const transfers = await transfersDB.findBy({ serialNumber });
    
    // Sort by creation date, most recent first
    transfers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sendSuccess(res, {
        serialNumber,
        transfers,
        count: transfers.length
    });
}));

// GET /api/transfer/verify/:code - Verify transfer code
router.get('/verify/:code', asyncHandler(async (req, res) => {
    const transferCode = req.params.code.toUpperCase();
    
    const transfer = await transfersDB.findOne({ transferCode });
    
    if (!transfer) {
        return sendError(res, 'Invalid transfer code', 404);
    }

    const device = await devicesDB.findById(transfer.deviceId);

    sendSuccess(res, {
        transfer: {
            id: transfer.id,
            serialNumber: transfer.serialNumber,
            status: transfer.status,
            transferReason: transfer.transferReason,
            currentOwnerName: device ? device.ownerName : 'Unknown',
            newOwnerName: transfer.newOwnerName,
            transferDate: transfer.transferDate,
            createdAt: transfer.createdAt
        },
        valid: true
    });
}));

// Helper function to generate transfer codes
function generateTransferCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = router;