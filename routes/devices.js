const express = require('express');
const router = express.Router();
const { devicesDB, reportsDB } = require('../utils/database');
const { 
    deviceValidationRules, 
    handleValidationErrors, 
    sanitizeDevice,
    idValidationRules 
} = require('../utils/validators');
const { 
    asyncHandler, 
    sendSuccess, 
    sendError,
    getDeviceStatus,
    generateStats
} = require('../utils/middleware');

// GET /api/devices - Get all devices with pagination
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const criteria = search ? { 
        $or: [
            { serialNumber: search },
            { brand: search },
            { model: search },
            { ownerName: search }
        ]
    } : {};

    const result = await devicesDB.paginate(page, limit, criteria);
    
    sendSuccess(res, {
        devices: result.items,
        pagination: result.pagination
    });
}));

// GET /api/devices/stats - Get device statistics
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await generateStats(devicesDB, reportsDB);
    sendSuccess(res, stats);
}));

// GET /api/devices/:id - Get specific device by ID
router.get('/:id', 
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const device = await devicesDB.findById(req.params.id);
        
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        // Get device status based on reports
        const reports = await reportsDB.read();
        const status = getDeviceStatus(device, reports);

        sendSuccess(res, {
            device: {
                ...device,
                status
            }
        });
    })
);

// POST /api/devices - Register a new device
router.post('/',
    deviceValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const deviceData = sanitizeDevice(req.body);
        
        // Check if device already exists
        const existingDevice = await devicesDB.findOne({ 
            serialNumber: deviceData.serialNumber 
        });
        
        if (existingDevice) {
            return sendError(res, 'Device with this serial number already exists', 409);
        }

        // Create new device
        const newDevice = await devicesDB.create({
            ...deviceData,
            images: [], // Will be populated when images are uploaded
            verified: false,
            registrationIP: req.ip
        });

        sendSuccess(res, { device: newDevice }, 'Device registered successfully', 201);
    })
);

// PUT /api/devices/:id - Update device information
router.put('/:id',
    idValidationRules(),
    deviceValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const deviceData = sanitizeDevice(req.body);
        
        // Check if device exists
        const existingDevice = await devicesDB.findById(req.params.id);
        if (!existingDevice) {
            return sendError(res, 'Device not found', 404);
        }

        // Check if serial number is being changed and if it conflicts
        if (deviceData.serialNumber !== existingDevice.serialNumber) {
            const conflictDevice = await devicesDB.findOne({ 
                serialNumber: deviceData.serialNumber 
            });
            
            if (conflictDevice && conflictDevice.id !== req.params.id) {
                return sendError(res, 'Device with this serial number already exists', 409);
            }
        }

        // Update device
        const updatedDevice = await devicesDB.update(req.params.id, deviceData);
        
        sendSuccess(res, { device: updatedDevice }, 'Device updated successfully');
    })
);

// DELETE /api/devices/:id - Delete device
router.delete('/:id',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const device = await devicesDB.findById(req.params.id);
        
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        await devicesDB.delete(req.params.id);
        
        sendSuccess(res, { deviceId: req.params.id }, 'Device deleted successfully');
    })
);

// POST /api/devices/:id/verify - Verify device ownership
router.post('/:id/verify',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { contact } = req.body;
        
        if (!contact) {
            return sendError(res, 'Contact information is required for verification', 400);
        }

        const device = await devicesDB.findById(req.params.id);
        
        if (!device) {
            return sendError(res, 'Device not found', 404);
        }

        // Simple verification - check if contact matches
        if (device.contact.toLowerCase() !== contact.toLowerCase()) {
            return sendError(res, 'Contact information does not match device owner', 403);
        }

        // Mark device as verified
        const updatedDevice = await devicesDB.update(req.params.id, { 
            verified: true,
            verifiedAt: new Date().toISOString()
        });

        sendSuccess(res, { device: updatedDevice }, 'Device ownership verified successfully');
    })
);

// GET /api/devices/serial/:serial - Find device by serial number
router.get('/serial/:serial', asyncHandler(async (req, res) => {
    const serialNumber = req.params.serial.toUpperCase();
    
    const device = await devicesDB.findOne({ serialNumber });
    
    if (!device) {
        return sendError(res, 'Device not found', 404);
    }

    // Get device status based on reports
    const reports = await reportsDB.read();
    const status = getDeviceStatus(device, reports);

    sendSuccess(res, {
        device: {
            ...device,
            status
        }
    });
}));

module.exports = router;