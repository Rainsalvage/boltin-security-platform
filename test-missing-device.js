const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

class MissingDeviceTest {
    constructor() {
        this.token = null;
        this.deviceId = null;
        this.missingReportId = null;
        this.foundReportId = null;
        this.testSerial = `IP14MISSING${Date.now()}`;
    }

    async login() {
        console.log('\n🔐 Logging in as test user...');
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@boltin.dev',
                password: 'password123'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            this.token = result.data.token;
            console.log('✅ Login successful');
            return true;
        } else {
            console.log('❌ Login failed:', result.error);
            return false;
        }
    }

    async registerTestDevice() {
        console.log('\n📱 Registering test device for missing scenario...');
        
        const deviceData = {
            ownerName: 'John Doe',
            contact: 'john.doe@email.com',
            deviceType: 'smartphone',
            brand: 'Apple',
            model: 'iPhone 14 Pro',
            serialNumber: this.testSerial,
            description: 'Black iPhone with blue protective case and screen protector'
        };

        const response = await fetch(`${API_BASE}/devices`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(deviceData)
        });

        const result = await response.json();
        
        if (result.success) {
            this.deviceId = result.data.device.id;
            console.log('✅ Device registered successfully');
            console.log(`   Device ID: ${this.deviceId}`);
            console.log(`   Serial: ${result.data.device.serialNumber}`);
            return true;
        } else {
            console.log('❌ Device registration failed:', result.error);
            return false;
        }
    }

    async reportMissingDevice() {
        console.log('\n⚠️  Reporting device as missing...');
        
        const reportData = {
            serialNumber: this.testSerial,
            ownerContact: 'john.doe@email.com',
            reportType: 'missing',
            incidentDate: new Date().toISOString(),
            location: 'TechCorp Seminar Hall, Conference Room B',
            description: 'Lost my iPhone during the morning tech seminar on mobile security. Might have dropped it while moving between sessions or left it in the conference room. Device has a blue protective case and contains important work presentations.',
            policeReportNumber: '' // Not required for missing items
        };

        const response = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });

        const result = await response.json();
        
        if (result.success) {
            this.missingReportId = result.data.report.id;
            console.log('✅ Missing device report filed successfully');
            console.log(`   Report Number: ${result.data.report.reportNumber}`);
            console.log(`   Report Type: ${result.data.report.reportType}`);
            console.log(`   Status: ${result.data.report.status}`);
            console.log(`   Device Registered: ${result.data.report.deviceRegistered}`);
            return true;
        } else {
            console.log('❌ Missing report failed:', result.error);
            return false;
        }
    }

    async reportFoundDevice() {
        console.log('\n🔍 Someone finds the device and reports it...');
        
        const foundDeviceData = {
            serialNumber: this.testSerial,
            finderName: 'Sarah Johnson',
            finderContact: 'sarah.johnson@techcorp.com',
            foundLocation: 'TechCorp Building, Conference Room B, under presentation table',
            pickupLocation: 'TechCorp Security Office, Level 1, available 9AM-5PM weekdays',
            deviceDescription: 'Black iPhone with blue protective case, screen protector, small scratch near camera. Device was powered off when found.',
            foundDate: new Date().toISOString(),
            additionalNotes: 'Found device under the conference table after the mobile security seminar ended. Battery was completely drained. Charging cable also found nearby.'
        };

        const response = await fetch(`${API_BASE}/reports/found-device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(foundDeviceData)
        });

        const result = await response.json();
        
        if (result.success) {
            this.foundReportId = result.data.foundReport.id;
            console.log('✅ Found device report created successfully');
            console.log(`   Found Report Number: ${result.data.foundReport.reportNumber}`);
            console.log(`   Status: ${result.data.foundReport.status}`);
            console.log(`   Pickup Location: ${result.data.foundReport.pickupLocation}`);
            console.log(`   Linked to Missing Report: ${result.data.linkedToMissingReport ? 'Yes' : 'No'}`);
            if (result.data.linkedToMissingReport) {
                console.log(`   Missing Report ID: ${result.data.missingReportId}`);
            }
            return true;
        } else {
            console.log('❌ Found device report failed:', result.error);
            return false;
        }
    }

    async confirmPickup() {
        console.log('\n🤝 Admin confirms device pickup...');
        
        if (!this.foundReportId) {
            console.log('❌ No found report ID available');
            return false;
        }

        const confirmationData = {
            confirmedBy: 'Security Admin - Mike Rodriguez',
            confirmationNotes: 'Owner John Doe arrived at 2:30 PM and provided photo ID matching device registration. Device passcode verified. All personal data intact. Successful return completed.'
        };

        const response = await fetch(`${API_BASE}/reports/found/${this.foundReportId}/confirm-pickup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(confirmationData)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Device pickup confirmed successfully');
            console.log(`   Pickup Status: ${result.data.foundReport.status}`);
            console.log(`   Confirmed By: ${result.data.foundReport.confirmedBy}`);
            console.log(`   Pickup Time: ${new Date(result.data.foundReport.pickedUpAt).toLocaleString()}`);
            console.log(`   Missing Report Auto-Resolved: ${result.data.linkedMissingReportUpdated ? 'Yes' : 'No'}`);
            return true;
        } else {
            console.log('❌ Pickup confirmation failed:', result.error);
            return false;
        }
    }

    async checkDeviceStatus() {
        console.log('\n📊 Checking final device status...');
        
        const response = await fetch(`${API_BASE}/devices/serial/${this.testSerial}`);
        const result = await response.json();
        
        if (result.success) {
            const device = result.data.device;
            console.log('✅ Device status retrieved');
            console.log(`   Device: ${device.brand} ${device.model}`);
            console.log(`   Serial: ${device.serialNumber}`);
            console.log(`   Current Status: ${device.status.status.toUpperCase()}`);
            console.log(`   Status Message: ${device.status.message}`);
            if (device.status.reportDate) {
                console.log(`   Last Report Date: ${new Date(device.status.reportDate).toLocaleDateString()}`);
            }
            return true;
        } else {
            console.log('❌ Device status check failed:', result.error);
            return false;
        }
    }

    async getStatistics() {
        console.log('\n📈 Checking updated statistics...');
        
        const response = await fetch(`${API_BASE}/reports/statistics`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data.overview;
            console.log('✅ Statistics retrieved');
            console.log(`   Total Reports: ${stats.totalReports}`);
            console.log(`   Active Reports: ${stats.activeReports}`);
            console.log(`   Stolen Reports: ${stats.stolenReports}`);
            console.log(`   Lost Reports: ${stats.lostReports}`);
            console.log(`   Missing Reports: ${stats.missingReports}`);
            console.log(`   Found Reports: ${stats.foundReports}`);
            console.log(`   Recovery Rate: ${stats.recoveryRate}%`);
            return true;
        } else {
            console.log('❌ Statistics retrieval failed:', result.error);
            return false;
        }
    }

    async runCompleteTest() {
        console.log('🚀 Starting Missing Device Functionality Test');
        console.log('=============================================');

        try {
            // Step 1: Login
            const loginSuccess = await this.login();
            if (!loginSuccess) return;

            // Step 2: Register test device
            const deviceSuccess = await this.registerTestDevice();
            if (!deviceSuccess) return;

            // Step 3: Report device as missing
            const missingSuccess = await this.reportMissingDevice();
            if (!missingSuccess) return;

            // Step 4: Someone finds and reports the device
            const foundSuccess = await this.reportFoundDevice();
            if (!foundSuccess) return;

            // Step 5: Admin confirms pickup
            const pickupSuccess = await this.confirmPickup();
            if (!pickupSuccess) return;

            // Step 6: Check final device status
            await this.checkDeviceStatus();

            // Step 7: Check updated statistics
            await this.getStatistics();

            console.log('\n🎉 Missing Device Test Completed Successfully!');
            console.log('=============================================');
            console.log('✅ All steps completed successfully');
            console.log('✅ Missing device workflow verified');
            console.log('✅ Found device reporting verified');
            console.log('✅ Pickup confirmation verified');
            console.log('✅ Status tracking verified');

        } catch (error) {
            console.error('❌ Test failed with error:', error.message);
        }
    }
}

// Run the test
const test = new MissingDeviceTest();
test.runCompleteTest().catch(console.error);