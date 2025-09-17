const express = require('express');
const router = express.Router();
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
    const type = req.query.type; // 'lost' or 'stolen'
    const status = req.query.status; // 'active', 'resolved', 'closed'
    
    let criteria = {};
    if (type && ['lost', 'stolen'].includes(type)) {
        criteria.reportType = type;
    }
    if (status && ['active', 'resolved', 'closed'].includes(status)) {
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