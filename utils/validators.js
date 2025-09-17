const { body, param, query, validationResult } = require('express-validator');

// Custom validation functions
const isValidSerialNumber = (value) => {
    // Check if serial number is at least 5 characters and contains alphanumeric characters
    return /^[A-Za-z0-9]{5,}$/.test(value);
};

const isValidContact = (value) => {
    // Check if it's a valid email or phone number
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
};

// Device validation rules
const deviceValidationRules = () => {
    return [
        body('ownerName')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Owner name must be between 2 and 100 characters')
            .matches(/^[a-zA-Z\s\-\.]+$/)
            .withMessage('Owner name can only contain letters, spaces, hyphens, and dots'),
        
        body('contact')
            .trim()
            .custom(isValidContact)
            .withMessage('Contact must be a valid email or phone number'),
        
        body('deviceType')
            .isIn(['smartphone', 'laptop', 'tablet', 'smartwatch', 'headphones', 'other'])
            .withMessage('Invalid device type'),
        
        body('brand')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Brand must be between 1 and 50 characters'),
        
        body('model')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Model must be between 1 and 100 characters'),
        
        body('serialNumber')
            .trim()
            .custom(isValidSerialNumber)
            .withMessage('Serial number must be at least 5 alphanumeric characters'),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters')
    ];
};

// Search validation rules
const searchValidationRules = () => {
    return [
        query('serial')
            .trim()
            .isLength({ min: 3 })
            .withMessage('Search term must be at least 3 characters')
    ];
};

// Transfer validation rules
const transferValidationRules = () => {
    return [
        body('currentOwnerContact')
            .trim()
            .custom(isValidContact)
            .withMessage('Current owner contact must be a valid email or phone number'),
        
        body('serialNumber')
            .trim()
            .custom(isValidSerialNumber)
            .withMessage('Serial number must be at least 5 alphanumeric characters'),
        
        body('transferReason')
            .isIn(['sale', 'gift', 'exchange', 'repair', 'other'])
            .withMessage('Invalid transfer reason'),
        
        body('newOwnerName')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('New owner name must be between 2 and 100 characters'),
        
        body('newOwnerContact')
            .trim()
            .custom(isValidContact)
            .withMessage('New owner contact must be a valid email or phone number'),
        
        body('newOwnerEmail')
            .optional()
            .trim()
            .isEmail()
            .withMessage('Invalid email format'),
        
        body('transferDate')
            .isISO8601()
            .toDate()
            .withMessage('Invalid transfer date'),
        
        body('transferNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Transfer notes cannot exceed 500 characters')
    ];
};

// Report validation rules
const reportValidationRules = () => {
    return [
        body('serialNumber')
            .trim()
            .custom(isValidSerialNumber)
            .withMessage('Serial number must be at least 5 alphanumeric characters'),
        
        body('ownerContact')
            .trim()
            .custom(isValidContact)
            .withMessage('Owner contact must be a valid email or phone number'),
        
        body('reportType')
            .isIn(['lost', 'stolen'])
            .withMessage('Report type must be either "lost" or "stolen"'),
        
        body('incidentDate')
            .isISO8601()
            .toDate()
            .withMessage('Invalid incident date'),
        
        body('location')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Location must be between 3 and 200 characters'),
        
        body('description')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters'),
        
        body('policeReportNumber')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Police report number cannot exceed 50 characters')
    ];
};

// ID parameter validation
const idValidationRules = () => {
    return [
        param('id')
            .isUUID()
            .withMessage('Invalid ID format')
    ];
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Sanitize input data
const sanitizeDevice = (data) => {
    return {
        ownerName: data.ownerName?.trim(),
        contact: data.contact?.trim(),
        deviceType: data.deviceType,
        brand: data.brand?.trim(),
        model: data.model?.trim(),
        serialNumber: data.serialNumber?.trim().toUpperCase(),
        description: data.description?.trim() || ''
    };
};

const sanitizeTransfer = (data) => {
    return {
        currentOwnerContact: data.currentOwnerContact?.trim(),
        serialNumber: data.serialNumber?.trim().toUpperCase(),
        transferReason: data.transferReason,
        newOwnerName: data.newOwnerName?.trim(),
        newOwnerContact: data.newOwnerContact?.trim(),
        newOwnerEmail: data.newOwnerEmail?.trim() || '',
        transferDate: data.transferDate,
        transferNotes: data.transferNotes?.trim() || ''
    };
};

const sanitizeReport = (data) => {
    return {
        serialNumber: data.serialNumber?.trim().toUpperCase(),
        ownerContact: data.ownerContact?.trim(),
        reportType: data.reportType,
        incidentDate: data.incidentDate,
        location: data.location?.trim(),
        description: data.description?.trim(),
        policeReportNumber: data.policeReportNumber?.trim() || ''
    };
};

module.exports = {
    deviceValidationRules,
    searchValidationRules,
    transferValidationRules,
    reportValidationRules,
    idValidationRules,
    handleValidationErrors,
    sanitizeDevice,
    sanitizeTransfer,
    sanitizeReport,
    isValidSerialNumber,
    isValidContact
};