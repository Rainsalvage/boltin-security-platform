// Device Profiles for Comprehensive Identification
// This module provides AI-powered suggestions for device-specific identification fields

const deviceProfiles = {
    // Mobile Devices
    smartphone: {
        name: 'Smartphone',
        icon: 'fas fa-mobile-alt',
        primaryId: 'IMEI Number',
        identificationFields: [
            {
                name: 'imei',
                label: 'IMEI Number',
                type: 'text',
                required: true,
                pattern: '^[0-9]{15}$',
                placeholder: '15-digit IMEI number',
                description: 'International Mobile Equipment Identity - unique to each phone',
                aiSuggestion: 'IMEI is crucial for smartphone tracking and blocking if stolen'
            },
            {
                name: 'imei2',
                label: 'IMEI2 (Dual SIM)',
                type: 'text',
                required: false,
                pattern: '^[0-9]{15}$',
                placeholder: '15-digit IMEI2 (if dual SIM)',
                description: 'Second IMEI for dual SIM phones',
                aiSuggestion: 'For dual SIM phones, both IMEI numbers help in comprehensive tracking'
            },
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Device serial number',
                description: 'Manufacturer serial number',
                aiSuggestion: 'Serial number helps identify the specific device unit'
            },
            {
                name: 'macAddress',
                label: 'WiFi MAC Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'WiFi MAC address for network tracking',
                aiSuggestion: 'MAC address enables location tracking through WiFi networks'
            }
        ],
        additionalInfo: [
            'Storage Capacity',
            'Color',
            'Operating System Version',
            'Network Carrier',
            'Purchase Date',
            'Warranty Status'
        ]
    },

    // Vehicles
    car: {
        name: 'Car/Vehicle',
        icon: 'fas fa-car',
        primaryId: 'Chassis Number (VIN)',
        identificationFields: [
            {
                name: 'vin',
                label: 'VIN/Chassis Number',
                type: 'text',
                required: true,
                pattern: '^[A-HJ-NPR-Z0-9]{17}$',
                placeholder: '17-character VIN',
                description: 'Vehicle Identification Number - unique to each vehicle',
                aiSuggestion: 'VIN is the most important identifier for vehicle tracking and recovery'
            },
            {
                name: 'engineNumber',
                label: 'Engine Number',
                type: 'text',
                required: true,
                placeholder: 'Engine identification number',
                description: 'Engine block identification number',
                aiSuggestion: 'Engine number helps verify vehicle authenticity and prevents engine swapping'
            },
            {
                name: 'licensePlate',
                label: 'License Plate Number',
                type: 'text',
                required: true,
                placeholder: 'License plate number',
                description: 'Current license plate registration',
                aiSuggestion: 'License plate enables quick identification by authorities'
            },
            {
                name: 'registrationNumber',
                label: 'Registration Number',
                type: 'text',
                required: false,
                placeholder: 'Vehicle registration number',
                description: 'Official vehicle registration number',
                aiSuggestion: 'Registration number links to official vehicle records'
            }
        ],
        additionalInfo: [
            'Year of Manufacture',
            'Mileage/Odometer Reading',
            'Fuel Type',
            'Transmission Type',
            'Number of Previous Owners',
            'Insurance Policy Number'
        ]
    },

    // Motorcycles
    motorcycle: {
        name: 'Motorcycle',
        icon: 'fas fa-motorcycle',
        primaryId: 'Chassis Number',
        identificationFields: [
            {
                name: 'chassisNumber',
                label: 'Chassis Number',
                type: 'text',
                required: true,
                placeholder: 'Motorcycle chassis number',
                description: 'Frame identification number',
                aiSuggestion: 'Chassis number is permanently stamped and crucial for motorcycle identification'
            },
            {
                name: 'engineNumber',
                label: 'Engine Number',
                type: 'text',
                required: true,
                placeholder: 'Engine identification number',
                description: 'Engine block identification',
                aiSuggestion: 'Engine number prevents engine replacement and aids in recovery'
            },
            {
                name: 'licensePlate',
                label: 'License Plate',
                type: 'text',
                required: true,
                placeholder: 'License plate number',
                description: 'Current license plate',
                aiSuggestion: 'Essential for quick identification by traffic authorities'
            }
        ],
        additionalInfo: [
            'Engine Capacity (CC)',
            'Year of Manufacture',
            'Mileage',
            'Fuel Type'
        ]
    },

    // Laptops
    laptop: {
        name: 'Laptop',
        icon: 'fas fa-laptop',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Manufacturer serial number',
                description: 'Unique device serial number',
                aiSuggestion: 'Serial number is the primary identifier for laptop tracking'
            },
            {
                name: 'serviceTag',
                label: 'Service Tag',
                type: 'text',
                required: false,
                placeholder: 'Service tag (Dell, HP, etc.)',
                description: 'Manufacturer service tag',
                aiSuggestion: 'Service tag provides detailed warranty and service history'
            },
            {
                name: 'macAddress',
                label: 'WiFi MAC Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'WiFi network identifier',
                aiSuggestion: 'MAC address enables network-based location tracking'
            },
            {
                name: 'bluetoothAddress',
                label: 'Bluetooth Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'Bluetooth device identifier',
                aiSuggestion: 'Bluetooth address helps in close-range device detection'
            }
        ],
        additionalInfo: [
            'RAM Size',
            'Storage Type & Size',
            'Processor Model',
            'Operating System',
            'Screen Size'
        ]
    },

    // Tablets
    tablet: {
        name: 'Tablet',
        icon: 'fas fa-tablet-alt',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Device serial number',
                description: 'Manufacturer serial number',
                aiSuggestion: 'Primary identifier for tablet tracking and warranty'
            },
            {
                name: 'imei',
                label: 'IMEI (Cellular Models)',
                type: 'text',
                required: false,
                pattern: '^[0-9]{15}$',
                placeholder: '15-digit IMEI (if cellular)',
                description: 'IMEI for cellular-enabled tablets',
                aiSuggestion: 'IMEI crucial for cellular tablets - enables carrier-level tracking'
            },
            {
                name: 'macAddress',
                label: 'WiFi MAC Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'WiFi identifier',
                aiSuggestion: 'Enables location tracking through WiFi networks'
            }
        ],
        additionalInfo: [
            'Storage Capacity',
            'Screen Size',
            'Cellular Capability',
            'Operating System Version'
        ]
    },

    // Smartwatches
    smartwatch: {
        name: 'Smartwatch',
        icon: 'fas fa-clock',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Watch serial number',
                description: 'Device serial number',
                aiSuggestion: 'Primary identifier for smartwatch tracking'
            },
            {
                name: 'imei',
                label: 'IMEI (Cellular Models)',
                type: 'text',
                required: false,
                pattern: '^[0-9]{15}$',
                placeholder: '15-digit IMEI (if cellular)',
                description: 'IMEI for cellular smartwatches',
                aiSuggestion: 'Essential for cellular smartwatches with independent connectivity'
            },
            {
                name: 'bluetoothAddress',
                label: 'Bluetooth Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'Bluetooth pairing identifier',
                aiSuggestion: 'Bluetooth address helps track paired device connections'
            }
        ],
        additionalInfo: [
            'Screen Size',
            'Strap Type',
            'Health Sensors',
            'Water Resistance'
        ]
    },

    // Cameras
    camera: {
        name: 'Camera',
        icon: 'fas fa-camera',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Body Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Camera body serial number',
                description: 'Camera body serial number',
                aiSuggestion: 'Body serial number is unique to each camera unit'
            },
            {
                name: 'lensSerial',
                label: 'Lens Serial Number',
                type: 'text',
                required: false,
                placeholder: 'Lens serial number',
                description: 'Attached lens serial number',
                aiSuggestion: 'Lens serial helps identify valuable attached equipment'
            },
            {
                name: 'shutterCount',
                label: 'Shutter Count',
                type: 'number',
                required: false,
                placeholder: 'Current shutter actuations',
                description: 'Number of photos taken',
                aiSuggestion: 'Shutter count indicates camera usage and authenticity'
            }
        ],
        additionalInfo: [
            'Sensor Type',
            'Megapixel Count',
            'Video Capabilities',
            'Memory Card Type'
        ]
    },

    // Gaming Consoles
    gaming_console: {
        name: 'Gaming Console',
        icon: 'fas fa-gamepad',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Console Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Console serial number',
                description: 'Console serial number',
                aiSuggestion: 'Serial number links to gaming account and purchase history'
            },
            {
                name: 'macAddress',
                label: 'MAC Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'Network interface identifier',
                aiSuggestion: 'MAC address enables network-based tracking and account linking'
            },
            {
                name: 'consoleId',
                label: 'Console ID',
                type: 'text',
                required: false,
                placeholder: 'Unique console identifier',
                description: 'Platform-specific console ID',
                aiSuggestion: 'Console ID links to gaming account and digital purchases'
            }
        ],
        additionalInfo: [
            'Storage Capacity',
            'Controller Serial Numbers',
            'Firmware Version',
            'Gaming Account Username'
        ]
    },

    // Audio Equipment
    headphones: {
        name: 'Headphones/Audio',
        icon: 'fas fa-headphones',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Audio device serial number',
                description: 'Device serial number',
                aiSuggestion: 'Serial number verifies authenticity and warranty status'
            },
            {
                name: 'bluetoothAddress',
                label: 'Bluetooth Address',
                type: 'text',
                required: false,
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                placeholder: 'XX:XX:XX:XX:XX:XX',
                description: 'Bluetooth pairing identifier',
                aiSuggestion: 'Bluetooth address helps track paired devices and connections'
            }
        ],
        additionalInfo: [
            'Driver Size',
            'Frequency Response',
            'Impedance',
            'Connectivity Type'
        ]
    },

    // Generic/Other devices
    other: {
        name: 'Other Device',
        icon: 'fas fa-microchip',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'serialNumber',
                label: 'Serial Number',
                type: 'text',
                required: true,
                placeholder: 'Device serial number',
                description: 'Primary device identifier',
                aiSuggestion: 'Serial number is essential for any electronic device identification'
            },
            {
                name: 'modelNumber',
                label: 'Model Number',
                type: 'text',
                required: false,
                placeholder: 'Manufacturer model number',
                description: 'Device model identifier',
                aiSuggestion: 'Model number helps categorize and identify device specifications'
            }
        ],
        additionalInfo: [
            'Manufacturing Date',
            'Firmware Version',
            'Hardware Revision'
        ]
    }
};

// AI-powered device analyzer
class DeviceAnalyzer {
    
    // Get comprehensive profile for device type
    static getDeviceProfile(deviceType) {
        const normalizedType = deviceType.toLowerCase().replace(/[_\s-]/g, '_');
        return deviceProfiles[normalizedType] || deviceProfiles.other;
    }

    // Generate AI suggestions for device identification
    static generateIdentificationSuggestions(deviceType, brand = '', model = '') {
        const profile = this.getDeviceProfile(deviceType);
        const suggestions = {
            deviceType: profile.name,
            primaryIdentifier: profile.primaryId,
            criticalFields: [],
            recommendations: [],
            securityTips: []
        };

        // Add critical identification fields
        profile.identificationFields.forEach(field => {
            if (field.required) {
                suggestions.criticalFields.push({
                    name: field.name,
                    label: field.label,
                    reason: field.aiSuggestion
                });
            }
        });

        // Generate brand-specific recommendations
        if (brand.toLowerCase().includes('apple')) {
            suggestions.recommendations.push('For Apple devices, also note the Find My activation status');
            suggestions.recommendations.push('Apple ID associated with the device is crucial for recovery');
        }

        if (brand.toLowerCase().includes('samsung')) {
            suggestions.recommendations.push('Samsung Find My Mobile can help track the device');
            suggestions.recommendations.push('Samsung account details enhance recovery chances');
        }

        // Generate device-specific security tips
        switch (deviceType.toLowerCase()) {
            case 'smartphone':
                suggestions.securityTips.push('Enable remote wipe and location tracking');
                suggestions.securityTips.push('Register with carrier for IMEI blocking');
                break;
            case 'car':
            case 'motorcycle':
                suggestions.securityTips.push('Install GPS tracking system');
                suggestions.securityTips.push('Keep registration documents in secure location');
                break;
            case 'laptop':
                suggestions.securityTips.push('Enable disk encryption and remote wipe');
                suggestions.securityTips.push('Install tracking software like Prey or LoJack');
                break;
        }

        return suggestions;
    }

    // Validate identification numbers
    static validateIdentificationField(fieldName, value, deviceType) {
        const profile = this.getDeviceProfile(deviceType);
        const field = profile.identificationFields.find(f => f.name === fieldName);
        
        if (!field) {
            return { valid: true, message: 'Field not found in profile' };
        }

        if (field.required && (!value || value.trim() === '')) {
            return { valid: false, message: `${field.label} is required for ${profile.name}` };
        }

        if (field.pattern && value) {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
                return { valid: false, message: `Invalid format for ${field.label}` };
            }
        }

        // Special validations
        if (fieldName === 'imei' && value) {
            return this.validateIMEI(value);
        }

        if (fieldName === 'vin' && value) {
            return this.validateVIN(value);
        }

        return { valid: true, message: 'Valid' };
    }

    // IMEI validation using Luhn algorithm
    static validateIMEI(imei) {
        if (!/^[0-9]{15}$/.test(imei)) {
            return { valid: false, message: 'IMEI must be exactly 15 digits' };
        }

        // Luhn algorithm check
        let sum = 0;
        for (let i = 0; i < 14; i++) {
            let digit = parseInt(imei[i]);
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        
        const checkDigit = (10 - (sum % 10)) % 10;
        const isValid = checkDigit === parseInt(imei[14]);
        
        return {
            valid: isValid,
            message: isValid ? 'Valid IMEI' : 'Invalid IMEI checksum'
        };
    }

    // VIN validation
    static validateVIN(vin) {
        if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
            return { valid: false, message: 'VIN must be 17 characters (no I, O, Q allowed)' };
        }

        // Basic VIN check digit validation would go here
        // For now, just format validation
        return { valid: true, message: 'Valid VIN format' };
    }

    // Get all supported device types
    static getSupportedDeviceTypes() {
        return Object.keys(deviceProfiles).map(key => ({
            value: key,
            name: deviceProfiles[key].name,
            icon: deviceProfiles[key].icon
        }));
    }

    // Search across all identification fields
    static searchDeviceByAnyId(devices, searchTerm) {
        const results = [];
        const normalizedSearch = searchTerm.toLowerCase().trim();

        devices.forEach(device => {
            const profile = this.getDeviceProfile(device.deviceType);
            let matchFound = false;
            let matchDetails = [];

            // Check all identification fields
            profile.identificationFields.forEach(field => {
                const fieldValue = device.identificationNumbers?.[field.name];
                if (fieldValue && fieldValue.toLowerCase().includes(normalizedSearch)) {
                    matchFound = true;
                    matchDetails.push({
                        field: field.label,
                        value: fieldValue,
                        type: field.name
                    });
                }
            });

            // Also check basic device info
            if (device.serialNumber?.toLowerCase().includes(normalizedSearch) ||
                device.brand?.toLowerCase().includes(normalizedSearch) ||
                device.model?.toLowerCase().includes(normalizedSearch)) {
                matchFound = true;
            }

            if (matchFound) {
                results.push({
                    ...device,
                    matchDetails
                });
            }
        });

        return results;
    }
}

module.exports = {
    deviceProfiles,
    DeviceAnalyzer
};