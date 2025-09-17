const express = require('express');
const router = express.Router();
const { devicesDB, reportsDB } = require('../utils/database');
const { 
    searchValidationRules, 
    handleValidationErrors 
} = require('../utils/validators');
const { 
    asyncHandler, 
    sendSuccess, 
    sendError,
    getDeviceStatus
} = require('../utils/middleware');

// GET /api/search - Search devices by serial number or other criteria
router.get('/', 
    searchValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { serial, brand, model, owner } = req.query;
        
        if (!serial && !brand && !model && !owner) {
            return sendError(res, 'At least one search parameter is required', 400);
        }

        let criteria = {};
        
        if (serial) {
            criteria.serialNumber = serial.toUpperCase();
        }
        
        if (brand) {
            criteria.brand = brand;
        }
        
        if (model) {
            criteria.model = model;
        }
        
        if (owner) {
            criteria.ownerName = owner;
        }

        const devices = await devicesDB.findBy(criteria);
        const reports = await reportsDB.read();

        // Add status information to each device
        const devicesWithStatus = devices.map(device => ({
            ...device,
            status: getDeviceStatus(device, reports)
        }));

        sendSuccess(res, {
            devices: devicesWithStatus,
            searchCriteria: { serial, brand, model, owner },
            count: devicesWithStatus.length
        });
    })
);

// GET /api/search/serial/:serial - Quick serial number search
router.get('/serial/:serial', asyncHandler(async (req, res) => {
    const serialNumber = req.params.serial.toUpperCase();
    
    if (serialNumber.length < 3) {
        return sendError(res, 'Serial number must be at least 3 characters', 400);
    }

    const device = await devicesDB.findOne({ serialNumber });
    const reports = await reportsDB.read();

    if (!device) {
        // Check if there are any reports for this serial number
        const deviceReports = reports.filter(report => 
            report.serialNumber === serialNumber
        );

        if (deviceReports.length > 0) {
            const latestReport = deviceReports.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];

            return sendSuccess(res, {
                found: false,
                device: null,
                status: {
                    status: latestReport.reportType,
                    message: `This device has been reported as ${latestReport.reportType} but is not registered in our system.`,
                    color: latestReport.reportType === 'stolen' ? 'danger' : 'warning',
                    reportDate: latestReport.incidentDate,
                    location: latestReport.location
                }
            });
        }

        return sendSuccess(res, {
            found: false,
            device: null,
            status: {
                status: 'unknown',
                message: 'This device is not registered in our system and has no reports.',
                color: 'info'
            }
        });
    }

    const status = getDeviceStatus(device, reports);

    sendSuccess(res, {
        found: true,
        device: {
            id: device.id,
            deviceType: device.deviceType,
            brand: device.brand,
            model: device.model,
            serialNumber: device.serialNumber,
            registeredAt: device.createdAt,
            // Hide sensitive owner information in public search
            ownerInitials: device.ownerName.split(' ').map(name => name[0]).join('.'),
            verified: device.verified
        },
        status
    });
}));

// GET /api/search/reports - Search reports by various criteria
router.get('/reports', asyncHandler(async (req, res) => {
    const { type, location, dateFrom, dateTo, serial } = req.query;
    
    let reports = await reportsDB.read();
    
    // Filter by report type
    if (type && ['lost', 'stolen'].includes(type)) {
        reports = reports.filter(report => report.reportType === type);
    }
    
    // Filter by location
    if (location) {
        reports = reports.filter(report => 
            report.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    // Filter by date range
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        reports = reports.filter(report => 
            new Date(report.incidentDate) >= fromDate
        );
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        reports = reports.filter(report => 
            new Date(report.incidentDate) <= toDate
        );
    }
    
    // Filter by serial number
    if (serial) {
        reports = reports.filter(report => 
            report.serialNumber.includes(serial.toUpperCase())
        );
    }

    // Sort by most recent first
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sendSuccess(res, {
        reports: reports.map(report => ({
            id: report.id,
            serialNumber: report.serialNumber,
            reportType: report.reportType,
            incidentDate: report.incidentDate,
            location: report.location,
            description: report.description,
            reportedAt: report.createdAt,
            // Hide sensitive owner information
            reporterInitials: report.ownerContact.includes('@') 
                ? report.ownerContact.split('@')[0].slice(0, 2) + '***'
                : report.ownerContact.slice(0, 3) + '***'
        })),
        filters: { type, location, dateFrom, dateTo, serial },
        count: reports.length
    });
}));

// GET /api/search/statistics - Get search and security statistics
router.get('/statistics', asyncHandler(async (req, res) => {
    const devices = await devicesDB.read();
    const reports = await reportsDB.read();
    
    // Calculate statistics
    const totalDevices = devices.length;
    const totalReports = reports.length;
    const stolenReports = reports.filter(r => r.reportType === 'stolen').length;
    const lostReports = reports.filter(r => r.reportType === 'lost').length;
    
    // Device type breakdown
    const deviceTypes = devices.reduce((acc, device) => {
        acc[device.deviceType] = (acc[device.deviceType] || 0) + 1;
        return acc;
    }, {});
    
    // Top brands
    const brands = devices.reduce((acc, device) => {
        acc[device.brand] = (acc[device.brand] || 0) + 1;
        return acc;
    }, {});
    
    const topBrands = Object.entries(brands)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([brand, count]) => ({ brand, count }));
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = devices.filter(device => 
        new Date(device.createdAt) >= thirtyDaysAgo
    ).length;
    
    const recentReports = reports.filter(report => 
        new Date(report.createdAt) >= thirtyDaysAgo
    ).length;
    
    sendSuccess(res, {
        overview: {
            totalDevices,
            totalReports,
            stolenReports,
            lostReports,
            safeDevices: totalDevices - (stolenReports + lostReports)
        },
        deviceTypes,
        topBrands,
        recentActivity: {
            registrations: recentRegistrations,
            reports: recentReports
        },
        securityIndex: totalDevices > 0 
            ? Math.round(((totalDevices - stolenReports) / totalDevices) * 100)
            : 100
    });
}));

module.exports = router;