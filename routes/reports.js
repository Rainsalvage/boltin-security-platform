const express = require('express');
const { Router } = require('express');
const { body } = require('express-validator');
const router = Router();
const { devicesDB, reportsDB } = require('../utils/database');
const { 
    reportValidationRules, 
    handleValidationErrors, 
    sanitizeReport,
    idValidationRules 
} = require('../utils/validators');
const { 
    asyncHandler, 
    sendSuccess, 
    sendError
} = require('../utils/middleware');

// GET /api/reports - Get all reports with pagination
router.get('/', asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type; // 'lost', 'stolen', 'missing', or 'found'
    const status = req.query.status; // 'active', 'resolved', 'closed', 'pending_pickup', 'completed'
    
    let criteria = {};
    if (type && ['lost', 'stolen', 'missing', 'found'].includes(type)) {
        criteria.reportType = type;
    }
    if (status && ['active', 'resolved', 'closed', 'pending_pickup', 'completed'].includes(status)) {
        criteria.status = status;
    }

    const result = await reportsDB.paginate(page, limit, criteria);
    
    sendSuccess(res, {
        reports: result.items,
        pagination: result.pagination,
        filters: { type, status }
    });
}));

// GET /api/reports/:id - Get specific report by ID
router.get('/:id', 
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const report = await reportsDB.findById(req.params.id);
        
        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        // Get associated device if it exists
        const device = await devicesDB.findOne({ 
            serialNumber: report.serialNumber 
        });

        sendSuccess(res, { 
            report,
            device: device ? {
                id: device.id,
                deviceType: device.deviceType,
                brand: device.brand,
                model: device.model,
                registered: true
            } : null
        });
    })
);

// POST /api/reports - Create a new lost/stolen report
router.post('/',
    reportValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const reportData = sanitizeReport(req.body);
        
        // Check if device exists in our system
        const device = await devicesDB.findOne({ 
            serialNumber: reportData.serialNumber 
        });
        
        let deviceOwnedByReporter = false;
        
        if (device) {
            // Verify if the reporter is the device owner
            deviceOwnedByReporter = device.contact.toLowerCase() === reportData.ownerContact.toLowerCase();
            
            if (!deviceOwnedByReporter) {
                return sendError(res, 'You can only report devices that are registered to your contact information', 403);
            }
        }

        // Check for existing active reports for this device
        const existingReport = await reportsDB.findOne({ 
            serialNumber: reportData.serialNumber,
            status: 'active'
        });
        
        if (existingReport) {
            return sendError(res, `This device already has an active ${existingReport.reportType} report`, 409);
        }

        // Create new report
        const newReport = await reportsDB.create({
            ...reportData,
            deviceId: device ? device.id : null,
            status: 'active',
            reportNumber: generateReportNumber(),
            reportIP: req.ip,
            deviceRegistered: !!device
        });

        sendSuccess(res, { 
            report: newReport,
            device: device ? {
                brand: device.brand,
                model: device.model,
                deviceType: device.deviceType
            } : null
        }, 'Report filed successfully', 201);
    })
);

// PUT /api/reports/:id/status - Update report status
router.put('/:id/status',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { status, notes } = req.body;
        
        if (!status || !['active', 'resolved', 'closed'].includes(status)) {
            return sendError(res, 'Valid status is required (active, resolved, closed)', 400);
        }

        const report = await reportsDB.findById(req.params.id);
        
        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        // Update report status
        const updatedReport = await reportsDB.update(req.params.id, {
            status,
            statusNotes: notes || '',
            statusUpdatedAt: new Date().toISOString()
        });

        sendSuccess(res, { 
            report: updatedReport 
        }, `Report status updated to ${status}`);
    })
);

// POST /api/reports/:id/found - Mark device as found/recovered
router.post('/:id/found',
    idValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { recoveryDetails, foundLocation, finderContact } = req.body;
        
        const report = await reportsDB.findById(req.params.id);
        
        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        if (report.status !== 'active') {
            return sendError(res, 'Can only mark active reports as found', 400);
        }

        // Update report with recovery information
        const updatedReport = await reportsDB.update(req.params.id, {
            status: 'resolved',
            recoveredAt: new Date().toISOString(),
            recoveryDetails: recoveryDetails || '',
            foundLocation: foundLocation || '',
            finderContact: finderContact || '',
            statusUpdatedAt: new Date().toISOString()
        });

        sendSuccess(res, { 
            report: updatedReport 
        }, 'Device marked as found/recovered');
    })
);

// POST /api/reports/found-device - Report a found device
router.post('/found-device',
    [
        body('serialNumber')
            .trim()
            .isLength({ min: 5 })
            .withMessage('Serial number must be at least 5 characters'),
        body('finderName')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Finder name must be between 2 and 100 characters'),
        body('finderContact')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Finder contact must be between 5 and 100 characters'),
        body('foundLocation')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Found location must be between 3 and 200 characters'),
        body('pickupLocation')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Pickup location must be between 3 and 200 characters'),
        body('deviceDescription')
            .trim()
            .isLength({ min: 10, max: 500 })
            .withMessage('Device description must be between 10 and 500 characters'),
        body('foundDate')
            .isISO8601()
            .toDate()
            .withMessage('Invalid found date'),
        body('additionalNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Additional notes cannot exceed 500 characters')
    ],
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const {
            serialNumber,
            finderName,
            finderContact,
            foundLocation,
            pickupLocation,
            deviceDescription,
            foundDate,
            additionalNotes
        } = req.body;
        
        const serialUpper = serialNumber.trim().toUpperCase();
        
        // Check if device exists in our system
        const device = await devicesDB.findOne({ 
            serialNumber: serialUpper 
        });
        
        // Check if there's an active missing/lost report for this device
        const existingReport = await reportsDB.findOne({ 
            serialNumber: serialUpper,
            status: 'active',
            reportType: { $in: ['missing', 'lost'] }
        });
        
        // Generate found device report number
        const foundReportNumber = `FD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        // Create found device report
        const foundDeviceReport = await reportsDB.create({
            reportType: 'found',
            reportNumber: foundReportNumber,
            serialNumber: serialUpper,
            deviceId: device ? device.id : null,
            deviceRegistered: !!device,
            finderName: finderName.trim(),
            finderContact: finderContact.trim(),
            foundLocation: foundLocation.trim(),
            pickupLocation: pickupLocation.trim(),
            deviceDescription: deviceDescription.trim(),
            foundDate,
            additionalNotes: additionalNotes?.trim() || '',
            status: 'pending_pickup',
            notificationSent: false,
            reportIP: req.ip
        });
        
        // If there's an active missing/lost report, link them
        if (existingReport) {
            await reportsDB.update(existingReport.id, {
                linkedFoundReport: foundDeviceReport.id,
                statusNotes: `Potentially found - Found Report #${foundReportNumber}`,
                statusUpdatedAt: new Date().toISOString()
            });
            
            // Update found report with linked missing report
            await reportsDB.update(foundDeviceReport.id, {
                linkedMissingReport: existingReport.id,
                originalOwnerContact: existingReport.ownerContact
            });
        }
        
        sendSuccess(res, {
            foundReport: foundDeviceReport,
            device: device ? {
                brand: device.brand,
                model: device.model,
                deviceType: device.deviceType,
                registered: true
            } : { registered: false },
            linkedToMissingReport: !!existingReport,
            missingReportId: existingReport ? existingReport.id : null
        }, 'Found device report created successfully', 201);
    })
);

// POST /api/reports/found/:id/confirm-pickup - Confirm device pickup
router.post('/found/:id/confirm-pickup',
    idValidationRules(),
    [
        body('confirmedBy')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Confirmed by field must be between 2 and 100 characters'),
        body('confirmationNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Confirmation notes cannot exceed 500 characters')
    ],
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { confirmedBy, confirmationNotes } = req.body;
        
        const foundReport = await reportsDB.findById(req.params.id);
        
        if (!foundReport) {
            return sendError(res, 'Found device report not found', 404);
        }
        
        if (foundReport.reportType !== 'found') {
            return sendError(res, 'This is not a found device report', 400);
        }
        
        if (foundReport.status === 'completed') {
            return sendError(res, 'Device pickup already confirmed', 400);
        }
        
        // Update found report to completed
        const updatedFoundReport = await reportsDB.update(req.params.id, {
            status: 'completed',
            pickedUpAt: new Date().toISOString(),
            confirmedBy: confirmedBy.trim(),
            confirmationNotes: confirmationNotes?.trim() || '',
            statusUpdatedAt: new Date().toISOString()
        });
        
        // If there's a linked missing report, update it to resolved
        if (foundReport.linkedMissingReport) {
            await reportsDB.update(foundReport.linkedMissingReport, {
                status: 'resolved',
                recoveredAt: new Date().toISOString(),
                recoveryDetails: `Device recovered through found report #${foundReport.reportNumber}`,
                statusUpdatedAt: new Date().toISOString()
            });
        }
        
        sendSuccess(res, {
            foundReport: updatedFoundReport,
            linkedMissingReportUpdated: !!foundReport.linkedMissingReport
        }, 'Device pickup confirmed successfully');
    })
);

// GET /api/reports/device/:serial - Get all reports for a specific device
router.get('/device/:serial', asyncHandler(async (req, res) => {
    const serialNumber = req.params.serial.toUpperCase();
    
    const reports = await reportsDB.findBy({ serialNumber });
    
    // Sort by creation date, most recent first
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get device information if it exists
    const device = await devicesDB.findOne({ serialNumber });

    sendSuccess(res, {
        serialNumber,
        device: device ? {
            brand: device.brand,
            model: device.model,
            deviceType: device.deviceType,
            registered: true
        } : { registered: false },
        reports,
        count: reports.length,
        hasActiveReport: reports.some(r => r.status === 'active')
    });
}));

// GET /api/reports/statistics - Get reporting statistics
router.get('/statistics', asyncHandler(async (req, res) => {
    const reports = await reportsDB.read();
    const devices = await devicesDB.read();
    
    // Calculate statistics
    const totalReports = reports.length;
    const activeReports = reports.filter(r => r.status === 'active').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const stolenReports = reports.filter(r => r.reportType === 'stolen').length;
    const lostReports = reports.filter(r => r.reportType === 'lost').length;
    const missingReports = reports.filter(r => r.reportType === 'missing').length;
    const foundReports = reports.filter(r => r.reportType === 'found').length;
    
    // Recovery rate
    const recoveryRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    
    // Recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentReports = reports.filter(report => 
        new Date(report.createdAt) >= sevenDaysAgo
    ).length;
    
    // Most common locations for incidents
    const locations = reports.reduce((acc, report) => {
        const location = report.location.toLowerCase();
        acc[location] = (acc[location] || 0) + 1;
        return acc;
    }, {});
    
    const topLocations = Object.entries(locations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));
    
    // Device types most commonly reported
    const reportedDeviceTypes = {};
    for (const report of reports) {
        if (report.deviceId) {
            const device = devices.find(d => d.id === report.deviceId);
            if (device) {
                const type = device.deviceType;
                reportedDeviceTypes[type] = (reportedDeviceTypes[type] || 0) + 1;
            }
        }
    }

    sendSuccess(res, {
        overview: {
            totalReports,
            activeReports,
            resolvedReports,
            stolenReports,
            lostReports,
            missingReports,
            foundReports,
            recoveryRate
        },
        recentActivity: {
            reportsLastWeek: recentReports
        },
        topIncidentLocations: topLocations,
        mostReportedDeviceTypes: Object.entries(reportedDeviceTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ deviceType: type, count }))
    });
}));

// GET /api/reports/public/:serial - Public report check (limited info)
router.get('/public/:serial', asyncHandler(async (req, res) => {
    const serialNumber = req.params.serial.toUpperCase();
    
    if (serialNumber.length < 5) {
        return sendError(res, 'Serial number must be at least 5 characters', 400);
    }

    const reports = await reportsDB.findBy({ 
        serialNumber,
        status: 'active'
    });
    
    if (reports.length === 0) {
        return sendSuccess(res, {
            serialNumber,
            reported: false,
            message: 'No active reports found for this device'
        });
    }

    const latestReport = reports.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    sendSuccess(res, {
        serialNumber,
        reported: true,
        reportType: latestReport.reportType,
        reportDate: latestReport.incidentDate,
        reportNumber: latestReport.reportNumber,
        message: `This device has been reported as ${latestReport.reportType}`,
        warningLevel: latestReport.reportType === 'stolen' ? 'high' : 'medium'
    });
}));

// Helper function to generate report numbers
function generateReportNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BR${timestamp}${random}`;
}

module.exports = router;