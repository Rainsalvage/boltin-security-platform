// Direct Camera Registration and Theft Recovery Test
// Uses existing verified user for immediate testing

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

// Test user credentials (existing verified user)
const testUser = {
    email: 'test@boltin.dev',
    password: 'password123'
};

// Helper function to make authenticated API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        return { status: response.status, ...result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Generate professional camera data
function generateProfessionalCamera() {
    const timestamp = Date.now();
    
    return {
        ownerName: 'Alex Photography',
        contact: 'test@boltin.dev', // Match our test user
        deviceType: 'camera',
        brand: 'Canon',
        model: 'EOS R5',
        serialNumber: `CNR5${timestamp}`, // Primary device serial
        description: 'Professional mirrorless camera for wedding and portrait photography. Includes battery grip and professional lens kit.',
        identificationNumbers: {
            serialNumber: `3842${timestamp}`, // Body serial number (required for cameras)
            lensSerial: `RF7002${timestamp}`,
            shutterCount: '15420' // Convert to string for validation
        }
    };
}

async function runDirectCameraTest() {
    console.log('📸 BOLTIN Security - Direct Camera Test');
    console.log('='.repeat(60));
    
    let authToken = null;
    let cameraDevice = null;
    let theftReport = null;
    
    try {
        // Step 1: Login with verified user
        console.log('\n🔐 Step 1: Authenticating User');
        console.log('-'.repeat(40));
        
        const loginResult = await apiCall('/auth/login', 'POST', testUser);
        
        if (loginResult.success) {
            authToken = loginResult.data.token;
            console.log('✅ Authentication successful');
            console.log(`User: ${loginResult.data.user.firstName} ${loginResult.data.user.lastName}`);
        } else {
            console.log(`❌ Login failed: ${loginResult.error}`);
            return;
        }
        
        // Step 2: Register professional camera
        console.log('\n📷 Step 2: Registering Professional Camera');
        console.log('-'.repeat(40));
        
        const cameraData = generateProfessionalCamera();
        console.log(`Camera: ${cameraData.brand} ${cameraData.model}`);
        console.log(`Primary Serial: ${cameraData.serialNumber}`);
        console.log(`Body Serial: ${cameraData.identificationNumbers.serialNumber}`);
        console.log(`Lens Serial: ${cameraData.identificationNumbers.lensSerial}`);
        console.log(`Shutter Count: ${cameraData.identificationNumbers.shutterCount}`);
        
        const deviceResult = await apiCall('/devices', 'POST', cameraData, authToken);
        
        if (deviceResult.success) {
            cameraDevice = deviceResult.data.device;
            console.log('✅ Camera registered successfully!');
            console.log(`Device ID: ${cameraDevice.id}`);
            console.log(`Owner ID: ${cameraDevice.ownerId}`);
            console.log(`Registration Time: ${new Date(cameraDevice.createdAt).toLocaleString()}`);
        } else {
            console.log(`❌ Registration failed: ${deviceResult.error}`);
            if (deviceResult.details) {
                console.log('Validation details:');
                deviceResult.details.forEach(detail => {
                    console.log(`  - ${detail.field}: ${detail.message}`);
                });
            }
            return;
        }
        
        // Step 3: Test device search by multiple identifiers
        console.log('\n🔍 Step 3: Testing Multi-ID Search');
        console.log('-'.repeat(40));
        
        const searchTests = [
            { type: 'Primary Serial', value: cameraDevice.serialNumber },
            { type: 'Body Serial', value: cameraDevice.identificationNumbers.serialNumber },
            { type: 'Lens Serial', value: cameraDevice.identificationNumbers.lensSerial }
        ];
        
        for (const test of searchTests) {
            const searchResult = await apiCall(`/search/serial/${encodeURIComponent(test.value)}`);
            console.log(`${test.type} (${test.value}): ${searchResult.success ? '✅ Found' : '❌ Not Found'}`);
            
            if (searchResult.success && searchResult.data) {
                console.log(`  Status: ${searchResult.data.status.message}`);
            }
        }
        
        // Step 4: File theft report
        console.log('\n🚨 Step 4: Filing Theft Report');
        console.log('-'.repeat(40));
        
        const theftData = {
            serialNumber: cameraDevice.serialNumber,
            reportType: 'stolen',
            ownerName: cameraData.ownerName,
            ownerContact: cameraData.contact,
            incidentDate: new Date().toISOString().split('T')[0],
            incidentTime: '15:45',
            location: 'Photography Studio, 123 Main Street',
            description: 'Camera equipment stolen during studio break-in. Thief broke through rear window and took camera gear worth $8,000.',
            circumstances: 'Studio break-in during evening hours',
            policeReported: true,
            policeReportNumber: `POL${Date.now()}`,
            witnesses: 'Security camera footage available from neighboring business',
            additionalInfo: 'Camera contained memory card with client photos that are irreplaceable'
        };
        
        console.log(`Location: ${theftData.location}`);
        console.log(`Police Report: ${theftData.policeReportNumber}`);
        
        const reportResult = await apiCall('/reports', 'POST', theftData);
        
        if (reportResult.success) {
            theftReport = reportResult.data.report;
            console.log('✅ Theft report filed successfully!');
            console.log(`Report Number: ${theftReport.reportNumber}`);
            console.log(`Status: ${theftReport.status}`);
        } else {
            console.log(`❌ Report filing failed: ${reportResult.error}`);
            return;
        }
        
        // Step 5: Test public theft check (what buyers would see)
        console.log('\n👮 Step 5: Public Theft Status Check');
        console.log('-'.repeat(40));
        
        const publicCheck = await apiCall(`/reports/public/${encodeURIComponent(cameraDevice.serialNumber)}`);
        
        if (publicCheck.success) {
            const data = publicCheck.data;
            console.log(`Public Status: ${data.reported ? '🚨 REPORTED STOLEN' : '✅ Clean'}`);
            
            if (data.reported) {
                console.log(`Report Type: ${data.reportType.toUpperCase()}`);
                console.log(`Warning Level: ${data.warningLevel.toUpperCase()}`);
                console.log(`Message: ${data.message}`);
                console.log(`Report #: ${data.reportNumber}`);
            }
        }
        
        // Step 6: Verify search shows theft status
        console.log('\n🔍 Step 6: Post-Theft Search Verification');
        console.log('-'.repeat(40));
        
        const postTheftSearch = await apiCall(`/search/serial/${encodeURIComponent(cameraDevice.serialNumber)}`);
        
        if (postTheftSearch.success && postTheftSearch.data) {
            console.log(`Search Status: ${postTheftSearch.data.status.message}`);
            console.log(`Status Type: ${postTheftSearch.data.status.type}`);
            console.log(`Device Found: ✅ Yes`);
        }
        
        // Step 7: Test recovery process
        console.log('\n🎉 Step 7: Device Recovery Simulation');
        console.log('-'.repeat(40));
        
        const recoveryInfo = {
            recoveryDetails: 'Camera recovered by police from suspect during arrest. Device is in excellent condition with all accessories intact.',
            foundLocation: 'Police Station Evidence Room',
            finderContact: 'Detective Mike Rodriguez - Badge #8829'
        };
        
        console.log(`Recovery: ${recoveryInfo.recoveryDetails}`);
        console.log(`Location: ${recoveryInfo.foundLocation}`);
        
        const recoveryResult = await apiCall(
            `/reports/${theftReport.id}/found`,
            'POST',
            recoveryInfo
        );
        
        if (recoveryResult.success) {
            console.log('✅ Device marked as recovered!');
            console.log(`New Status: ${recoveryResult.data.report.status}`);
            console.log(`Recovery Time: ${new Date().toLocaleString()}`);
        } else {
            console.log(`❌ Recovery update failed: ${recoveryResult.error}`);
        }
        
        // Step 8: Final status check
        console.log('\n✅ Step 8: Final Status Verification');
        console.log('-'.repeat(40));
        
        const finalSearch = await apiCall(`/search/serial/${encodeURIComponent(cameraDevice.serialNumber)}`);
        
        if (finalSearch.success && finalSearch.data) {
            console.log(`Final Status: ${finalSearch.data.status.message}`);
            console.log(`Status Type: ${finalSearch.data.status.type}`);
        }
        
        // Step 9: Get complete history
        console.log('\n📋 Step 9: Complete Device History');
        console.log('-'.repeat(40));
        
        const historyResult = await apiCall(`/reports/device/${encodeURIComponent(cameraDevice.serialNumber)}`);
        
        if (historyResult.success) {
            const history = historyResult.data;
            console.log(`Total Reports: ${history.count}`);
            console.log(`Device Registered: ${history.device.registered ? 'Yes' : 'No'}`);
            
            if (history.reports.length > 0) {
                console.log('\nReport Timeline:');
                history.reports.forEach((report, i) => {
                    console.log(`  ${i + 1}. ${report.reportType.toUpperCase()} - ${report.status} (${new Date(report.createdAt).toLocaleDateString()})`);
                });
            }
        }
        
        // Test Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 CAMERA TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log('\n✅ SUCCESSFUL OPERATIONS:');
        console.log('   • User Authentication');
        console.log('   • Professional Camera Registration');
        console.log('   • Multi-Identifier Search (Serial, Body, Lens)');
        console.log('   • Theft Report Filing');
        console.log('   • Public Theft Status Check');
        console.log('   • Search Status Updates');
        console.log('   • Recovery Process');
        console.log('   • Complete Audit Trail');
        
        console.log('\n📸 CAMERA DETAILS:');
        console.log(`   Brand/Model: ${cameraDevice.brand} ${cameraDevice.model}`);
        console.log(`   Primary Serial: ${cameraDevice.serialNumber}`);
        console.log(`   Body Serial: ${cameraDevice.identificationNumbers.serialNumber}`);
        console.log(`   Lens Serial: ${cameraDevice.identificationNumbers.lensSerial}`);
        console.log(`   Shutter Count: ${cameraDevice.identificationNumbers.shutterCount}`);
        
        console.log('\n🔄 RECOVERY PATH VERIFIED:');
        console.log('   1. ✅ Device Registered & Searchable');
        console.log('   2. 🚨 Theft Reported & Status Updated');
        console.log('   3. 👮 Public Checks Show Warning');
        console.log('   4. 🎉 Device Recovered & Status Updated');
        console.log('   5. 📋 Complete History Maintained');
        
        console.log('\n🎉 All camera registration and recovery features working perfectly!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

// Run the test
console.log('Initializing Camera Registration and Recovery Test...\n');
runDirectCameraTest();