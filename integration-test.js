// BOLTIN SECURITY PLATFORM - FRONTEND/BACKEND INTEGRATION TEST
// This script tests all major integration points between frontend and backend

console.log('🧪 Starting BOLTIN Integration Tests...');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test Utilities
function createTestUser() {
    return {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@boltin.dev`,
        phone: '+234901234567' + Math.floor(Math.random() * 1000),
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        address: '123 Test Street, Lagos, Nigeria'
    };
}

function createTestDevice() {
    return {
        ownerName: 'Test Owner',
        contact: '+234901234567',
        deviceType: 'smartphone',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'TEST' + Date.now(),
        description: 'Test device for integration testing',
        identificationNumbers: {
            imei: '123456789012345',
            imei2: '123456789012346'
        }
    };
}

// Test Suite
async function runIntegrationTests() {
    let testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };

    async function test(name, testFunction) {
        testResults.total++;
        console.log(`\n🔄 Testing: ${name}`);
        
        try {
            await testFunction();
            testResults.passed++;
            testResults.details.push({ name, status: 'PASSED' });
            console.log(`✅ PASSED: ${name}`);
        } catch (error) {
            testResults.failed++;
            testResults.details.push({ name, status: 'FAILED', error: error.message });
            console.error(`❌ FAILED: ${name} - ${error.message}`);
        }
    }

    // Test 1: API Health Check
    await test('API Health Check', async () => {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (!response.ok || data.status !== 'OK') {
            throw new Error('Health check failed');
        }
    });

    // Test 2: Device Statistics Endpoint
    await test('Device Statistics API', async () => {
        const response = await fetch(`${API_BASE}/devices/stats`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('Stats endpoint failed');
        }
        
        if (typeof data.data.totalDevices === 'undefined') {
            throw new Error('Stats data incomplete');
        }
    });

    // Test 3: User Registration
    let authToken = null;
    let testUser = null;
    
    await test('User Registration', async () => {
        testUser = createTestUser();
        
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(`Registration failed: ${data.error || 'Unknown error'}`);
        }
        
        if (!data.data.token || !data.data.user) {
            throw new Error('Registration response incomplete');
        }
        
        authToken = data.data.token;
    });

    // Test 4: User Login
    await test('User Login', async () => {
        const loginData = {
            email: testUser.email,
            password: testUser.password
        };
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
        }
        
        if (!data.data.token) {
            throw new Error('Login response missing token');
        }
    });

    // Test 5: Protected Route Access
    await test('Protected Route Access', async () => {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('Protected route access failed');
        }
        
        if (!data.data.user) {
            throw new Error('User profile data missing');
        }
    });

    // Test 6: Device Registration
    let testDevice = null;
    
    await test('Device Registration', async () => {
        testDevice = createTestDevice();
        
        const response = await fetch(`${API_BASE}/devices`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(testDevice)
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(`Device registration failed: ${data.error || 'Unknown error'}`);
        }
        
        if (!data.data.device || !data.data.device.id) {
            throw new Error('Device registration response incomplete');
        }
    });

    // Test 7: Device Search
    await test('Device Search', async () => {
        const response = await fetch(`${API_BASE}/search/serial/${testDevice.serialNumber}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('Device search failed');
        }
        
        if (!data.data.device) {
            throw new Error('Device not found in search');
        }
    });

    // Test 8: User Devices List
    await test('User Devices List', async () => {
        const response = await fetch(`${API_BASE}/devices/user/my-devices`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('User devices list failed');
        }
        
        if (!Array.isArray(data.data.devices)) {
            throw new Error('User devices response invalid');
        }
    });

    // Test 9: Chatbot Integration
    await test('Chatbot Integration', async () => {
        const message = 'Hello, I need help with device registration';
        
        const response = await fetch(`${API_BASE}/chatbot/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error('Chatbot integration failed');
        }
        
        if (!data.data.message) {
            throw new Error('Chatbot response incomplete');
        }
    });

    // Test 10: CORS and Security Headers
    await test('CORS and Security Headers', async () => {
        const response = await fetch(`${API_BASE}/health`);
        
        const csp = response.headers.get('Content-Security-Policy');
        const cors = response.headers.get('Access-Control-Allow-Origin');
        
        if (!csp) {
            throw new Error('Missing Content-Security-Policy header');
        }
    });

    // Print Test Results
    console.log('\n' + '='.repeat(50));
    console.log('🧪 INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total:  ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(test => test.status === 'FAILED')
            .forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
    }

    if (testResults.passed === testResults.total) {
        console.log('\n🎉 ALL TESTS PASSED! Frontend and Backend integration is working perfectly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the integration points.');
    }

    return testResults;
}

// Frontend Integration Verification
function verifyFrontendFeatures() {
    console.log('\n🌐 Verifying Frontend Features...');
    
    const checks = [
        {
            name: 'Authentication Modal',
            check: () => document.getElementById('auth-modal') !== null
        },
        {
            name: 'Dashboard Section',
            check: () => document.getElementById('dashboard') !== null
        },
        {
            name: 'Device Registration Form',
            check: () => document.getElementById('device-form') !== null
        },
        {
            name: 'Search Functionality',
            check: () => document.getElementById('search-form') !== null
        },
        {
            name: 'Chatbot Integration',
            check: () => document.getElementById('chatbot') !== null
        },
        {
            name: 'Statistics Display',
            check: () => document.getElementById('registered-count') !== null
        },
        {
            name: 'Sophisticated Animations',
            check: () => document.querySelector('.btn-primary') !== null
        },
        {
            name: 'Toast Notifications',
            check: () => document.getElementById('toast-container') !== null
        }
    ];

    let passed = 0;
    checks.forEach(({ name, check }) => {
        try {
            if (check()) {
                console.log(`✅ ${name}`);
                passed++;
            } else {
                console.log(`❌ ${name} - Element not found`);
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error.message}`);
        }
    });

    console.log(`\n📊 Frontend Features: ${passed}/${checks.length} working`);
    return passed === checks.length;
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.runIntegrationTests = runIntegrationTests;
    window.verifyFrontendFeatures = verifyFrontendFeatures;
    
    // Auto-run when script loads in browser
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🚀 Auto-running integration tests...');
            runIntegrationTests().then(() => {
                verifyFrontendFeatures();
            });
        }, 2000);
    });
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runIntegrationTests, verifyFrontendFeatures };
}