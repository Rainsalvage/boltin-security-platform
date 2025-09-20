const express = require('express');
const { Router } = require('express');
const router = Router();
const { devicesDB, reportsDB } = require('../utils/database');
const { DeviceAnalyzer } = require('../utils/deviceProfiles');
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

// GET /api/search - Enhanced search across all identification numbers
router.get('/', 
    searchValidationRules(),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { serial, brand, model, owner, searchTerm } = req.query;
        
        if (!serial && !brand && !model && !owner && !searchTerm) {
            return sendError(res, 'At least one search parameter is required', 400);
        }

        const devices = await devicesDB.read();
        let filteredDevices = devices;
        
        // If searchTerm is provided, use enhanced search across all ID fields
        if (searchTerm) {
            filteredDevices = DeviceAnalyzer.searchDeviceByAnyId(devices, searchTerm);
        } else {
            // Original search logic for specific fields
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

            filteredDevices = await devicesDB.findBy(criteria);
        }
        
        const reports = await reportsDB.read();

        // Add status information to each device
        const devicesWithStatus = filteredDevices.map(device => ({
            ...device,
            status: getDeviceStatus(device, reports)
        }));

        sendSuccess(res, {
            devices: devicesWithStatus,
            searchCriteria: { serial, brand, model, owner, searchTerm },
            count: devicesWithStatus.length,
            enhancedSearch: !!searchTerm
        });
    })
);

// GET /api/search/serial/:serial - Enhanced quick search across all ID fields
router.get('/serial/:serial', asyncHandler(async (req, res) => {
    const searchTerm = req.params.serial;
    
    if (searchTerm.length < 3) {
        return sendError(res, 'Search term must be at least 3 characters', 400);
    }

    const devices = await devicesDB.read();
    const reports = await reportsDB.read();
    
    // Enhanced search across all identification fields
    const searchResults = DeviceAnalyzer.searchDeviceByAnyId(devices, searchTerm);
    
    // Also try exact serial number match for backward compatibility
    const exactMatch = devices.find(device => 
        device.serialNumber === searchTerm.toUpperCase()
    );
    
    let foundDevice = null;
    let matchType = 'none';
    
    if (exactMatch) {
        foundDevice = exactMatch;
        matchType = 'exact_serial';
    } else if (searchResults.length > 0) {
        foundDevice = searchResults[0]; // Take first match
        matchType = 'identification_field';
    }

    if (!foundDevice) {
        // Check if there are any reports for this identifier
        const deviceReports = reports.filter(report => {
            const reportSerial = report.serialNumber;
            return reportSerial === searchTerm.toUpperCase() || 
                   reportSerial.toLowerCase().includes(searchTerm.toLowerCase());
        });

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

    const status = getDeviceStatus(foundDevice, reports);

    sendSuccess(res, {
        found: true,
        device: {
            id: foundDevice.id,
            deviceType: foundDevice.deviceType,
            brand: foundDevice.brand,
            model: foundDevice.model,
            serialNumber: foundDevice.serialNumber,
            registeredAt: foundDevice.createdAt,
            // Hide sensitive owner information in public search
            ownerInitials: foundDevice.ownerName.split(' ').map(name => name[0]).join('.'),
            verified: foundDevice.verified,
            identificationNumbers: foundDevice.identificationNumbers || {}
        },
        status,
        matchType,
        searchTerm
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

// GET /api/search/device-profiles - Get all supported device types and their profiles
router.get('/device-profiles', asyncHandler(async (req, res) => {
    const supportedTypes = DeviceAnalyzer.getSupportedDeviceTypes();
    
    sendSuccess(res, {
        deviceTypes: supportedTypes,
        count: supportedTypes.length
    });
}));

// GET /api/search/device-profile/:type - Get specific device type profile
router.get('/device-profile/:type', asyncHandler(async (req, res) => {
    const deviceType = req.params.type;
    const profile = DeviceAnalyzer.getDeviceProfile(deviceType);
    
    sendSuccess(res, {
        deviceType,
        profile
    });
}));

// POST /api/search/ai-suggestions - Get AI suggestions for device identification
router.post('/ai-suggestions', asyncHandler(async (req, res) => {
    const { deviceType, brand, model } = req.body;
    
    if (!deviceType) {
        return sendError(res, 'Device type is required', 400);
    }
    
    const suggestions = DeviceAnalyzer.generateIdentificationSuggestions(
        deviceType, 
        brand || '', 
        model || ''
    );
    
    sendSuccess(res, {
        suggestions,
        deviceType,
        brand,
        model
    });
}));

// POST /api/search/validate-field - Validate specific identification field
router.post('/validate-field', asyncHandler(async (req, res) => {
    const { fieldName, value, deviceType } = req.body;
    
    if (!fieldName || !deviceType) {
        return sendError(res, 'Field name and device type are required', 400);
    }
    
    const validation = DeviceAnalyzer.validateIdentificationField(fieldName, value, deviceType);
    
    sendSuccess(res, {
        fieldName,
        value,
        deviceType,
        validation
    });
}));

module.exports = router;