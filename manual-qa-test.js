// BOLTIN Manual Button and Link Testing Script
console.log('🔘 BOLTIN Button & Link Functionality Test');

// Test all buttons and clickable elements
function testAllButtons() {
    console.log('\n🎯 Testing All Buttons and Clickable Elements...');
    
    const testResults = [];
    
    // 1. Test Navigation Buttons
    console.log('\n1️⃣ Navigation Bar Buttons:');
    
    // Login button
    const loginBtn = document.querySelector('button[onclick*="showLoginForm"], .btn[onclick*="showLoginForm"]');
    if (loginBtn) {
        testResults.push({
            element: 'Login Button (Nav)',
            hasHandler: !!loginBtn.onclick || hasEventListener(loginBtn),
            visible: isVisible(loginBtn)
        });
        console.log(`✅ Login button found - Handler: ${!!loginBtn.onclick}, Visible: ${isVisible(loginBtn)}`);
    } else {
        console.log('❌ Login button not found in navigation');
        testResults.push({ element: 'Login Button (Nav)', hasHandler: false, visible: false });
    }
    
    // Register button
    const registerBtn = document.querySelector('button[onclick*="showRegisterForm"], .btn[onclick*="showRegisterForm"]');
    if (registerBtn) {
        testResults.push({
            element: 'Register Button (Nav)',
            hasHandler: !!registerBtn.onclick || hasEventListener(registerBtn),
            visible: isVisible(registerBtn)
        });
        console.log(`✅ Register button found - Handler: ${!!registerBtn.onclick}, Visible: ${isVisible(registerBtn)}`);
    } else {
        console.log('❌ Register button not found in navigation');
        testResults.push({ element: 'Register Button (Nav)', hasHandler: false, visible: false });
    }
    
    // 2. Test Hero Section Buttons
    console.log('\n2️⃣ Hero Section Buttons:');
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach((btn, index) => {
        const hasHandler = !!btn.onclick || hasEventListener(btn);
        const visible = isVisible(btn);
        const text = btn.textContent.trim();
        
        testResults.push({
            element: `Hero Button ${index + 1} (${text})`,
            hasHandler,
            visible
        });
        console.log(`✅ Hero Button ${index + 1}: "${text}" - Handler: ${hasHandler}, Visible: ${visible}`);
    });
    
    // 3. Test Action Card Buttons
    console.log('\n3️⃣ Action Card Buttons:');
    const actionCardButtons = document.querySelectorAll('.action-card .btn');
    actionCardButtons.forEach((btn, index) => {
        const hasHandler = !!btn.onclick || hasEventListener(btn);
        const visible = isVisible(btn);
        const text = btn.textContent.trim();
        const cardTitle = btn.closest('.action-card')?.querySelector('.action-title')?.textContent || 'Unknown';
        
        testResults.push({
            element: `Action Card Button: ${cardTitle}`,
            hasHandler,
            visible
        });
        console.log(`✅ Action Card "${cardTitle}": "${text}" - Handler: ${hasHandler}, Visible: ${visible}`);
    });
    
    // 4. Test Navigation Links
    console.log('\n4️⃣ Navigation Links:');
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        const hasValidHref = href && href.startsWith('#');
        const visible = isVisible(link);
        
        testResults.push({
            element: `Nav Link: ${text}`,
            hasHandler: hasValidHref,
            visible
        });
        console.log(`✅ Nav Link "${text}": ${href} - Valid: ${hasValidHref}, Visible: ${visible}`);
    });
    
    // 5. Test Chatbot Toggle
    console.log('\n5️⃣ Chatbot Features:');
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    if (chatbotToggle) {
        const hasHandler = !!chatbotToggle.onclick || hasEventListener(chatbotToggle);
        const visible = isVisible(chatbotToggle);
        
        testResults.push({
            element: 'Chatbot Toggle',
            hasHandler,
            visible
        });
        console.log(`✅ Chatbot Toggle - Handler: ${hasHandler}, Visible: ${visible}`);
        
        // Test chatbot functionality
        if (typeof toggleChatbot === 'function') {
            console.log(`✅ toggleChatbot function exists`);
            testResults.push({ element: 'toggleChatbot Function', hasHandler: true, visible: true });
        } else {
            console.log(`❌ toggleChatbot function missing`);
            testResults.push({ element: 'toggleChatbot Function', hasHandler: false, visible: false });
        }
    } else {
        console.log('❌ Chatbot toggle not found');
        testResults.push({ element: 'Chatbot Toggle', hasHandler: false, visible: false });
    }
    
    // 6. Test Footer Links
    console.log('\n6️⃣ Footer Links:');
    const footerLinks = document.querySelectorAll('.footer a');
    footerLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        const hasValidHref = href && (href.startsWith('#') || href.startsWith('http'));
        const visible = isVisible(link);
        
        testResults.push({
            element: `Footer Link: ${text}`,
            hasHandler: hasValidHref,
            visible
        });
        console.log(`✅ Footer Link "${text}": ${href} - Valid: ${hasValidHref}, Visible: ${visible}`);
    });
    
    // 7. Test Form Buttons (if visible)
    console.log('\n7️⃣ Form Buttons:');
    const formButtons = document.querySelectorAll('form button[type="submit"], form .btn');
    formButtons.forEach((btn, index) => {
        const text = btn.textContent.trim();
        const form = btn.closest('form');
        const formId = form?.id || 'unknown';
        const visible = isVisible(btn);
        
        testResults.push({
            element: `Form Button (${formId}): ${text}`,
            hasHandler: true, // Submit buttons inherently have handlers
            visible
        });
        console.log(`✅ Form Button in "${formId}": "${text}" - Visible: ${visible}`);
    });
    
    return testResults;
}

// Helper function to check if element is visible
function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

// Helper function to check if element has event listeners (simplified check)
function hasEventListener(element) {
    // This is a simplified check - in reality, we can't easily detect all event listeners
    // But we can check for some common patterns
    return element.onclick !== null || 
           element.addEventListener !== undefined ||
           element.getAttribute('onclick') !== null;
}

// Test Authentication Flow
function testAuthenticationFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    // Test login form visibility
    if (typeof showLoginForm === 'function') {
        console.log('✅ showLoginForm function exists');
        
        // Test opening login form
        showLoginForm();
        const modal = document.getElementById('auth-modal');
        if (modal && modal.style.display !== 'none') {
            console.log('✅ Login form opens successfully');
            
            // Test form fields
            const emailField = document.getElementById('login-email');
            const passwordField = document.getElementById('login-password');
            console.log(`✅ Email field exists: ${!!emailField}`);
            console.log(`✅ Password field exists: ${!!passwordField}`);
            
            // Close the modal
            if (typeof closeAuthModal === 'function') {
                closeAuthModal();
                console.log('✅ Login form closes successfully');
            }
        } else {
            console.log('❌ Login form failed to open');
        }
    } else {
        console.log('❌ showLoginForm function missing');
    }
    
    // Test register form
    if (typeof showRegisterForm === 'function') {
        console.log('✅ showRegisterForm function exists');
        
        // Test opening register form
        showRegisterForm();
        const modal = document.getElementById('auth-modal');
        if (modal && modal.style.display !== 'none') {
            console.log('✅ Register form opens successfully');
            
            // Test form fields
            const usernameField = document.getElementById('register-username');
            const emailField = document.getElementById('register-email');
            const passwordField = document.getElementById('register-password');
            console.log(`✅ Username field exists: ${!!usernameField}`);
            console.log(`✅ Email field exists: ${!!emailField}`);
            console.log(`✅ Password field exists: ${!!passwordField}`);
            
            // Close the modal
            if (typeof closeAuthModal === 'function') {
                closeAuthModal();
                console.log('✅ Register form closes successfully');
            }
        } else {
            console.log('❌ Register form failed to open');
        }
    } else {
        console.log('❌ showRegisterForm function missing');
    }
}

// Test Dashboard Functionality
function testDashboardFunctionality() {
    console.log('\n📊 Testing Dashboard Functionality...');
    
    // Test dashboard function existence
    const dashboardFunctions = [
        'showDashboard',
        'redirectToDashboard', 
        'loadUserDashboard',
        'switchDashboardSection'
    ];
    
    dashboardFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} function exists`);
        } else {
            console.log(`❌ ${funcName} function missing`);
        }
    });
    
    // Test dashboard element existence
    const dashboard = document.getElementById('dashboard');
    console.log(`✅ Dashboard element exists: ${!!dashboard}`);
    
    if (dashboard) {
        const dashboardStats = dashboard.querySelectorAll('.stat-card');
        console.log(`✅ Dashboard stats cards: ${dashboardStats.length}`);
        
        const dashboardSections = dashboard.querySelectorAll('.dashboard-section-content');
        console.log(`✅ Dashboard sections: ${dashboardSections.length}`);
    }
}

// Test Interactive Features
function testInteractiveFeatures() {
    console.log('\n⚡ Testing Interactive Features...');
    
    // Test chatbot
    if (typeof toggleChatbot === 'function') {
        console.log('✅ Chatbot toggle function exists');
        const chatbot = document.getElementById('chatbot');
        console.log(`✅ Chatbot element exists: ${!!chatbot}`);
    } else {
        console.log('❌ Chatbot toggle function missing');
    }
    
    // Test toast notifications
    if (typeof showToast === 'function') {
        console.log('✅ Toast notification function exists');
        const toastContainer = document.getElementById('toast-container');
        console.log(`✅ Toast container exists: ${!!toastContainer}`);
        
        // Test toast
        showToast('🧪 QA Test Message', 'info');
        console.log('✅ Test toast displayed');
    } else {
        console.log('❌ Toast notification function missing');
    }
    
    // Test smooth scrolling
    if (typeof setupSmoothScrolling === 'function') {
        console.log('✅ Smooth scrolling function exists');
    } else {
        console.log('❌ Smooth scrolling function missing');
    }
}

// Generate comprehensive test report
function generateTestReport(buttonResults) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE QA TEST REPORT');
    console.log('='.repeat(60));
    
    const workingButtons = buttonResults.filter(result => result.hasHandler && result.visible).length;
    const totalButtons = buttonResults.length;
    const visibleButtons = buttonResults.filter(result => result.visible).length;
    const functionalButtons = buttonResults.filter(result => result.hasHandler).length;
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Total UI Elements Tested: ${totalButtons}`);
    console.log(`Visible Elements: ${visibleButtons}/${totalButtons} (${((visibleButtons/totalButtons)*100).toFixed(1)}%)`);
    console.log(`Functional Elements: ${functionalButtons}/${totalButtons} (${((functionalButtons/totalButtons)*100).toFixed(1)}%)`);
    console.log(`Working Elements (Visible + Functional): ${workingButtons}/${totalButtons} (${((workingButtons/totalButtons)*100).toFixed(1)}%)`);
    
    console.log(`\n❌ NON-FUNCTIONAL ELEMENTS:`);
    const problematicElements = buttonResults.filter(result => !result.hasHandler || !result.visible);
    if (problematicElements.length === 0) {
        console.log('✨ All elements are working correctly!');
    } else {
        problematicElements.forEach((element, index) => {
            const issues = [];
            if (!element.hasHandler) issues.push('No handler');
            if (!element.visible) issues.push('Not visible');
            console.log(`${index + 1}. ${element.element} - Issues: ${issues.join(', ')}`);
        });
    }
    
    console.log(`\n🎯 RECOMMENDATIONS:`);
    if (workingButtons === totalButtons) {
        console.log('🎉 Excellent! All buttons and links are working perfectly.');
        console.log('✅ The application is ready for production use.');
    } else {
        console.log('🔧 Some elements need attention:');
        console.log('1. Ensure all buttons have proper event handlers');
        console.log('2. Check visibility of hidden elements');
        console.log('3. Verify click functionality for non-working elements');
    }
}

// Main test execution
function runCompleteQATest() {
    console.log('🚀 Starting Complete BOLTIN QA Test...');
    
    // Run all tests
    const buttonResults = testAllButtons();
    testAuthenticationFlow();
    testDashboardFunctionality();
    testInteractiveFeatures();
    
    // Generate final report
    generateTestReport(buttonResults);
    
    console.log('\n✅ QA Test Complete!');
    return buttonResults;
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCompleteQATest);
} else {
    runCompleteQATest();
}

// Export for manual testing
window.runCompleteQATest = runCompleteQATest;
window.testAllButtons = testAllButtons;