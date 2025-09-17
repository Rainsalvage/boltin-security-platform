// Boltin App - Main JavaScript Functionality

// Global variables
let registeredDevices = 0;
let recoveredDevices = 0;
let currentTransferStep = 1;
let currentUser = null;
let authToken = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadStats();
    setupEventListeners();
    animateCounters();
    startLiveActivityFeed();
    setupScrollIndicator();
    setupMobileEnhancements();
    checkAuthStatus();
});

// Initialize the application
function initializeApp() {
    console.log('🛡️ Boltin Security Platform Initialized');
    
    // Check if user is returning
    const isReturningUser = localStorage.getItem('boltin_user');
    if (isReturningUser) {
        showWelcomeMessage();
    }
}

// Load statistics from backend API
async function loadStats() {
    try {
        const response = await fetch('/api/devices/stats');
        if (response.ok) {
            const result = await response.json();
            const stats = result.data;
            
            registeredDevices = stats.totalDevices || 0;
            recoveredDevices = stats.safeDevices || 0;
            
            // Update counters
            document.getElementById('registered-count').textContent = registeredDevices;
            document.getElementById('recovered-count').textContent = recoveredDevices;
        } else {
            throw new Error('Failed to load stats');
        }
    } catch (error) {
        console.log('📊 Loading demo statistics...', error);
        registeredDevices = 1247;
        recoveredDevices = 1089;
        document.getElementById('registered-count').textContent = registeredDevices;
        document.getElementById('recovered-count').textContent = recoveredDevices;
    }
}

// Setup all event listeners
function setupEventListeners() {
    setupNavigation();
    setupRegistrationForm();
    setupSearchForm();
    setupChatForm();
    setupSmoothScrolling();
    setupMobileMenu();
    setupImageUpload();
    setupTransferForm();
    setupAdditionalButtons();
    setupAuthForms();
    setupDashboardMenu();
    setupCameraSignatureFeature();
}

// Setup additional button functionality
function setupAdditionalButtons() {
    // Ensure all action buttons work even without onclick attributes
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        // Skip if already has click event
        if (!button.onclick) {
            const buttonText = button.textContent.toLowerCase();
            if (buttonText.includes('register') || buttonText.includes('start registration')) {
                button.addEventListener('click', () => redirectToDashboard('register'));
            } else if (buttonText.includes('search') || buttonText.includes('search now')) {
                button.addEventListener('click', () => redirectToDashboard('search'));
            } else if (buttonText.includes('report') || buttonText.includes('report device')) {
                button.addEventListener('click', () => redirectToDashboard('reports'));
            } else if (buttonText.includes('transfer') || buttonText.includes('execute transfer')) {
                button.addEventListener('click', () => redirectToDashboard('transfers'));
            } else if (buttonText.includes('assistant') || buttonText.includes('contact command')) {
                button.addEventListener('click', toggleChatbot);
            }
        }
    });
    
    // Setup close buttons for modals
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
            closeReportModal();
        }
    });
    
    // Setup footer links
    const footerLinks = document.querySelectorAll('.footer a[href^="#"]');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            
            // Redirect to dashboard if logged in
            if (currentUser && authToken) {
                if (target === '#register') {
                    redirectToDashboard('register');
                } else if (target === '#search') {
                    redirectToDashboard('search');
                } else if (target === '#dashboard') {
                    showDashboard();
                } else {
                    const targetElement = document.querySelector(target);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            } else {
                if (target === '#register') {
                    showRegistration();
                } else if (target === '#search') {
                    showSearch();
                } else if (target === '#dashboard') {
                    showToast('👉 Please login to access your dashboard', 'info');
                    showLoginForm();
                } else {
                    const targetElement = document.querySelector(target);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    });
}

// Setup image upload functionality
function setupImageUpload() {
    const fileInput = document.getElementById('device-images');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }
}

// Setup transfer form functionality
function setupTransferForm() {
    const transferForm = document.getElementById('transfer-form');
    if (transferForm) {
        transferForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (currentTransferStep < 3) {
                nextTransferStep();
            } else {
                submitTransfer();
            }
        });
    }
}

// Show registration form
function showRegistration() {
    if (currentUser && authToken) {
        // Redirect to dashboard if logged in
        redirectToDashboard('register');
        return;
    }
    
    hideAllSections();
    const section = document.getElementById('register');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(() => {
        document.getElementById('owner-name').focus();
    }, 500);
}

// Show search section
function showSearch() {
    if (currentUser && authToken) {
        // Redirect to dashboard if logged in
        redirectToDashboard('search');
        return;
    }
    
    hideAllSections();
    const section = document.getElementById('search');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(() => {
        document.getElementById('search-serial').focus();
    }, 500);
}

// Show lost device report form
function showLostReport() {
    if (currentUser && authToken) {
        // Redirect to dashboard if logged in
        redirectToDashboard('reports');
        return;
    }
    
    showReportForm();
}

// Show transfer form
function showTransfer() {
    if (currentUser && authToken) {
        // Redirect to dashboard if logged in
        redirectToDashboard('transfers');
        return;
    }
    
    if (!currentUser) {
        showToast('❌ Please login to transfer devices', 'error');
        showLoginForm();
        return;
    }
    
    hideAllSections();
    const section = document.getElementById('transfer');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(() => {
        document.getElementById('current-owner-contact').focus();
    }, 500);
}

// Show report form with optional pre-filled serial
function showReportForm(serialNumber = '') {
    // Create report form modal
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-exclamation-triangle"></i> Report Lost/Stolen Device</h2>
                <button class="close-modal" onclick="closeReportModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="report-form" class="report-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="report-serial">Device Serial/IMEI Number *</label>
                        <input type="text" id="report-serial" name="serialNumber" value="${serialNumber}" required>
                    </div>
                    <div class="form-group">
                        <label for="report-contact">Your Contact *</label>
                        <input type="text" id="report-contact" name="ownerContact" placeholder="Email or Phone" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="report-type">Report Type *</label>
                        <select id="report-type" name="reportType" required>
                            <option value="">Select Type</option>
                            <option value="lost">Lost</option>
                            <option value="stolen">Stolen</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="incident-date">Incident Date *</label>
                        <input type="date" id="incident-date" name="incidentDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="incident-location">Location *</label>
                    <input type="text" id="incident-location" name="location" placeholder="Where did this happen?" required>
                </div>
                <div class="form-group">
                    <label for="incident-description">Description *</label>
                    <textarea id="incident-description" name="description" rows="4" placeholder="Please describe what happened..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="police-report">Police Report Number (Optional)</label>
                    <input type="text" id="police-report" name="policeReportNumber" placeholder="If you filed a police report">
                </div>
                <button type="submit" class="submit-button">
                    <i class="fas fa-exclamation-triangle"></i>
                    Submit Report
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup form submission
    document.getElementById('report-form').addEventListener('submit', handleReportSubmission);
    
    // Focus on first input
    setTimeout(() => {
        if (!serialNumber) {
            document.getElementById('report-serial').focus();
        } else {
            document.getElementById('report-contact').focus();
        }
    }, 100);
}

// Handle report submission
async function handleReportSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const reportData = {
        serialNumber: formData.get('serialNumber'),
        ownerContact: formData.get('ownerContact'),
        reportType: formData.get('reportType'),
        incidentDate: formData.get('incidentDate'),
        location: formData.get('location'),
        description: formData.get('description'),
        policeReportNumber: formData.get('policeReportNumber')
    };
    
    const submitButton = e.target.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting Report...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const report = result.data.report;
            showToast('✅ Report submitted successfully!', 'success');
            showToast(`📝 Report Number: ${report.reportNumber}`, 'info');
            closeReportModal();
        } else {
            showToast(`❌ ${result.error || 'Report submission failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Report submission failed. Please try again.', 'error');
        console.error('Report submission error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Close report modal
function closeReportModal() {
    const modal = document.querySelector('.report-modal');
    if (modal) {
        modal.remove();
    }
}



// Hide all sections
function hideAllSections() {
    const sections = document.querySelectorAll('.registration-section, .search-section, .transfer-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Setup registration form
function setupRegistrationForm() {
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', handleRegistration);
    }
}

// Handle device registration with enhanced identification numbers
async function handleRegistration(e) {
    e.preventDefault();
    
    if (!currentUser || !authToken) {
        showToast('❌ Please login to register devices', 'error');
        showLoginForm();
        return;
    }
    
    const formData = new FormData(e.target);
    
    const deviceData = {
        ownerName: formData.get('ownerName'),
        contact: formData.get('contact'),
        deviceType: formData.get('deviceType'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        serialNumber: formData.get('serialNumber'),
        description: formData.get('description')
    };
    
    // Collect identification numbers from dynamic fields
    const identificationNumbers = {};
    const deviceType = deviceData.deviceType;
    
    if (deviceType && deviceProfiles[deviceType]) {
        const profile = deviceProfiles[deviceType];
        
        profile.identificationFields.forEach(field => {
            const fieldElement = document.getElementById(`id-${field.name}`);
            if (fieldElement && fieldElement.value.trim()) {
                identificationNumbers[field.name] = fieldElement.value.trim();
            }
        });
        
        // Add identification numbers to device data
        if (Object.keys(identificationNumbers).length > 0) {
            deviceData.identificationNumbers = identificationNumbers;
        }
    }
    
    if (!validateRegistrationForm(deviceData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitButton.disabled = true;
    
    try {
        // First register the device
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(deviceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const deviceId = result.data.device.id;
            
            // Upload images if any
            const imageFiles = document.getElementById('device-images').files;
            if (imageFiles.length > 0) {
                await uploadDeviceImages(deviceId, imageFiles);
            }
            
            // Upload camera signature if provided
            const signatureFile = document.getElementById('camera-signature');
            if (signatureFile && signatureFile.files.length > 0) {
                await uploadCameraSignature(deviceId, signatureFile.files[0]);
            }
            
            showToast('✅ Device registered successfully!', 'success');
            e.target.reset();
            
            // Clear uploaded images preview
            const previewContainer = document.getElementById('image-preview-container');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
            
            // Clear camera signature preview
            const signaturePreview = document.getElementById('signature-preview');
            if (signaturePreview) {
                signaturePreview.innerHTML = '';
            }
            
            // Hide camera signature group
            const cameraSignatureGroup = document.getElementById('camera-signature-group');
            if (cameraSignatureGroup) {
                cameraSignatureGroup.style.display = 'none';
            }
            
            loadStats();
            localStorage.setItem('boltin_user', 'true');
        } else {
            showToast(`❌ ${result.error || 'Registration failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Registration failed. Please try again.', 'error');
        console.error('Registration error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Validate registration form
function validateRegistrationForm(data) {
    if (!data.ownerName || data.ownerName.trim().length < 2) {
        showToast('❌ Please enter a valid owner name', 'error');
        return false;
    }
    
    if (!data.contact || data.contact.trim().length < 5) {
        showToast('❌ Please enter a valid contact', 'error');
        return false;
    }
    
    if (!data.serialNumber || data.serialNumber.trim().length < 5) {
        showToast('❌ Please enter a valid serial/IMEI number', 'error');
        return false;
    }
    
    return true;
}

// Setup search form
function setupSearchForm() {
    const form = document.getElementById('search-form');
    if (form) {
        form.addEventListener('submit', handleSearch);
    }
}

// Handle device search with enhanced backend API
async function handleSearch(e) {
    e.preventDefault();
    
    const serial = document.getElementById('search-serial').value.trim();
    
    if (!serial || serial.length < 3) {
        showToast('❌ Please enter a valid search term (minimum 3 characters)', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('.search-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    submitButton.disabled = true;
    
    try {
        // Use enhanced search endpoint that searches across all identification fields
        const response = await fetch(`/api/search/serial/${encodeURIComponent(serial)}`);
        const result = await response.json();
        
        displaySearchResults(result.data, serial);
    } catch (error) {
        showToast('❌ Search failed. Please try again.', 'error');
        console.error('Search error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Display search results with enhanced backend data
// Display enhanced search results with identification details
function displaySearchResults(result, searchedSerial) {
    const resultsContainer = document.getElementById('search-results');
    
    if (result.found && result.device) {
        const device = result.device;
        const status = result.status;
        const statusClass = status.status === 'stolen' ? 'status-lost' : 
                           status.status === 'lost' ? 'status-warning' : 'status-safe';
        const statusIcon = status.status === 'stolen' ? 'fas fa-skull-crossbones' : 
                          status.status === 'lost' ? 'fas fa-exclamation-triangle' : 'fas fa-shield-alt';
        
        // Generate identification fields display
        let identificationInfo = '';
        if (device.identificationNumbers && Object.keys(device.identificationNumbers).length > 0) {
            const deviceType = device.deviceType || 'other';
            const profile = deviceProfiles[deviceType] || deviceProfiles.other;
            
            identificationInfo = '<div class="identification-info">';
            identificationInfo += '<h4><i class="fas fa-fingerprint"></i> Identification Details</h4>';
            
            Object.entries(device.identificationNumbers).forEach(([fieldName, fieldValue]) => {
                const field = profile.identificationFields.find(f => f.name === fieldName);
                const fieldLabel = field ? field.label : fieldName.toUpperCase();
                
                identificationInfo += `<p><strong>${fieldLabel}:</strong> ${fieldValue}</p>`;
            });
            
            identificationInfo += '</div>';
        }
        
        // Show match details if enhanced search was used
        let matchInfo = '';
        if (result.matchType && result.matchType !== 'exact_serial') {
            matchInfo = `
                <div class="match-info">
                    <p class="enhanced-search-notice">
                        <i class="fas fa-robot"></i> 
                        Enhanced AI search found this device using: <strong>${result.searchTerm}</strong>
                    </p>
                </div>
            `;
        }
        
        resultsContainer.innerHTML = `
            <div class="search-result ${statusClass}">
                <div class="result-header">
                    <i class="${statusIcon}"></i>
                    <span class="status-text">${status.message}</span>
                </div>
                ${matchInfo}
                <div class="device-info">
                    <h3>${device.brand} ${device.model}</h3>
                    <p><strong>Device Type:</strong> ${device.deviceType}</p>
                    <p><strong>Primary Serial:</strong> ${device.serialNumber}</p>
                    ${identificationInfo}
                    <p><strong>Owner:</strong> ${device.ownerInitials || 'Protected'}</p>
                    <p><strong>Registered:</strong> ${new Date(device.registeredAt).toLocaleDateString()}</p>
                    <p><strong>Verified:</strong> ${device.verified ? '✅ Yes' : '⚠️ Pending'}</p>
                    ${status.reportDate ? `<p><strong>Report Date:</strong> ${new Date(status.reportDate).toLocaleDateString()}</p>` : ''}
                    ${status.location ? `<p><strong>Last Location:</strong> ${status.location}</p>` : ''}
                    ${device.cameraSignature ? '<p><strong>Camera Signature:</strong> ✅ Verified</p>' : ''}
                </div>
                <div class="device-actions">
                    ${status.status !== 'safe' ? 
                        `<p class="warning">⚠️ Contact local authorities if you have information about this device!</p>
                         ${status.location ? '<button class="action-button" onclick="showLocationMap(\'' + device.serialNumber + '\', \'' + status.location + '\')" style="margin-top: 1rem;"><i class="fas fa-map-marker-alt"></i> View Location</button>' : ''}` : 
                        '<p class="safe-notice">✅ This device is safely registered and has no reports against it.</p>'
                    }
                </div>
            </div>
        `;
    } else {
        // Device not found or reports only
        let statusInfo = '';
        if (result.status) {
            const status = result.status;
            const statusClass = status.status === 'stolen' ? 'status-lost' : 
                               status.status === 'lost' ? 'status-warning' : 'status-unknown';
            
            statusInfo = `
                <div class="status-warning ${statusClass}">
                    <h4>${status.message}</h4>
                    ${status.reportDate ? `<p><strong>Report Date:</strong> ${new Date(status.reportDate).toLocaleDateString()}</p>` : ''}
                    ${status.location ? `<p><strong>Location:</strong> ${status.location}</p>` : ''}
                </div>
            `;
        }
        
        resultsContainer.innerHTML = `
            <div class="search-result status-unknown">
                <div class="result-header">
                    <i class="fas fa-question-circle"></i>
                    <span class="status-text">DEVICE NOT REGISTERED</span>
                </div>
                ${statusInfo}
                <p>Search Term: <strong>${searchedSerial}</strong></p>
                <p>This device identifier is not registered in our database.</p>
                <div class="action-buttons">
                    <button class="register-button" onclick="showRegistration()">
                        <i class="fas fa-plus"></i> Register This Device
                    </button>
                    <button class="report-button" onclick="showReportForm('${searchedSerial}')">
                        <i class="fas fa-exclamation-triangle"></i> Report Lost/Stolen
                    </button>
                </div>
            </div>
        `;
    }
    
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Show location map for stolen device
function showLocationMap(serialNumber, locationText) {
    const mapContainer = document.getElementById('location-map-container');
    const lastLocationSpan = document.getElementById('last-location');
    const lastSeenSpan = document.getElementById('last-seen');
    const deviceStatusSpan = document.getElementById('device-status');
    
    if (mapContainer) {
        mapContainer.style.display = 'block';
        
        // Update location info
        if (lastLocationSpan) lastLocationSpan.textContent = locationText || 'Unknown';
        if (lastSeenSpan) lastSeenSpan.textContent = new Date().toLocaleString();
        if (deviceStatusSpan) {
            deviceStatusSpan.textContent = 'STOLEN';
            deviceStatusSpan.className = 'status-badge stolen';
        }
        
        // Get user's current location if permission granted
        const userLocation = localStorage.getItem('boltin_location');
        if (userLocation) {
            try {
                const location = JSON.parse(userLocation);
                showToast('📍 Using your location for enhanced tracking assistance', 'info');
                
                // In a real app, this would integrate with a mapping service
                const mapElement = document.getElementById('location-map');
                if (mapElement) {
                    mapElement.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #666;">
                            <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #ff0000;"></i>
                            <h3>Device Location Tracking</h3>
                            <p>Serial: ${serialNumber}</p>
                            <p>Last Known Location: ${locationText}</p>
                            <p style="margin-top: 2rem; padding: 1rem; background: rgba(255,0,0,0.1); border-radius: 8px; border: 1px solid rgba(255,0,0,0.3);">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>Security Alert:</strong> This device has been reported as stolen.
                                <br>If you have any information, please contact local authorities.
                            </p>
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('Error parsing location:', error);
            }
        } else {
            const mapElement = document.getElementById('location-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #666;">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Location Tracking Unavailable</h3>
                        <p>Enable location access for enhanced tracking features</p>
                        <button onclick="handleLocationPermission()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Enable Location
                        </button>
                    </div>
                `;
            }
        }
        
        mapContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Toggle chatbot
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot.style.display === 'none' || !chatbot.style.display) {
        chatbot.style.display = 'flex';
        document.getElementById('chat-input').focus();
    } else {
        chatbot.style.display = 'none';
    }
}

// Setup mobile menu
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            
            // If user is logged in, redirect main actions to dashboard
            if (currentUser && authToken) {
                if (target === '#register') {
                    redirectToDashboard('register');
                    return;
                } else if (target === '#search') {
                    redirectToDashboard('search');
                    return;
                } else if (target === '#transfer') {
                    redirectToDashboard('transfers');
                    return;
                } else if (target === '#dashboard') {
                    showDashboard();
                    return;
                }
            } else {
                // For non-logged in users, show standalone sections
                if (target === '#register') {
                    showRegistration();
                    return;
                } else if (target === '#search') {
                    showSearch();
                    return;
                } else if (target === '#transfer') {
                    showTransfer();
                    return;
                } else if (target === '#dashboard') {
                    showToast('👉 Please login to access your dashboard', 'info');
                    showLoginForm();
                    return;
                }
            }
            
            // Handle other navigation normally
            const targetElement = document.querySelector(target);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Also setup hero CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            
            // Redirect to dashboard if logged in
            if (currentUser && authToken) {
                if (target === '#register' || target === '#dashboard') {
                    redirectToDashboard('register');
                } else if (target === '#search') {
                    redirectToDashboard('search');
                } else if (target === '#transfer') {
                    redirectToDashboard('transfers');
                }
            } else {
                // Show login prompt for guests
                showToast('👉 Please login to access dashboard features', 'info');
                showLoginForm();
            }
        });
    });
}

// Setup smooth scrolling (exclude navigation links to avoid conflicts)
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]:not(.nav-link):not(.cta-button)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Setup chat form
function setupChatForm() {
    const form = document.getElementById('chat-form');
    if (form) {
        form.addEventListener('submit', handleChatMessage);
    }
}

// Handle chat message
async function handleChatMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch('/api/chatbot/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const result = await response.json();
        
        if (result.success) {
            addChatMessage(result.data.message, 'bot');
        } else {
            addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        addChatMessage("I'm having trouble connecting. Please try again later.", 'bot');
    }
}

// Image Upload Functions with backend integration
function triggerImageUpload() {
    const fileInput = document.getElementById('device-images');
    fileInput.click();
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('image-preview-container');
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview';
                imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Device Image">
                    <button type="button" class="remove-image" onclick="removeImage(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clear the file input to allow re-uploading the same file
    event.target.value = '';
}

// Upload device images to backend
async function uploadDeviceImages(deviceId, files) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        formData.append('deviceImages', files[i]);
    }
    
    try {
        const response = await fetch(`/api/upload/device-images/${deviceId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`📸 ${result.data.uploadedImages.length} image(s) uploaded successfully`, 'success');
        } else {
            showToast('⚠️ Image upload failed', 'warning');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        showToast('⚠️ Image upload failed', 'warning');
    }
}

// Upload camera signature to backend
async function uploadCameraSignature(deviceId, file) {
    const formData = new FormData();
    formData.append('cameraSignature', file);
    
    try {
        const response = await fetch(`/api/upload/camera-signature/${deviceId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('📷 Camera signature uploaded successfully', 'success');
        } else {
            showToast('⚠️ Camera signature upload failed', 'warning');
        }
    } catch (error) {
        console.error('Camera signature upload error:', error);
        showToast('⚠️ Camera signature upload failed', 'warning');
    }
}

function removeImage(button) {
    const imagePreview = button.closest('.image-preview');
    imagePreview.remove();
}

// Transfer Workflow Functions

function nextTransferStep() {
    if (currentTransferStep < 3) {
        // Validate current step before proceeding
        if (validateTransferStep(currentTransferStep)) {
            currentTransferStep++;
            updateTransferStep();
        }
    }
}

function previousTransferStep() {
    if (currentTransferStep > 1) {
        currentTransferStep--;
        updateTransferStep();
    }
}

function updateTransferStep() {
    // Update step indicators
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentTransferStep);
    });
    
    // Show/hide step content
    const stepContents = document.querySelectorAll('.transfer-step-content');
    stepContents.forEach((content, index) => {
        content.style.display = (index + 1 === currentTransferStep) ? 'block' : 'none';
    });
    
    // Update transfer summary if on step 3
    if (currentTransferStep === 3) {
        updateTransferSummary();
    }
    
    // Update navigation buttons
    const prevButton = document.querySelector('.transfer-nav .prev-button');
    const nextButton = document.querySelector('.transfer-nav .next-button');
    const submitButton = document.querySelector('.transfer-nav .submit-button');
    
    if (prevButton) prevButton.style.display = currentTransferStep > 1 ? 'inline-block' : 'none';
    if (nextButton) nextButton.style.display = currentTransferStep < 3 ? 'inline-block' : 'none';
    if (submitButton) submitButton.style.display = currentTransferStep === 3 ? 'inline-block' : 'none';
}

function updateTransferSummary() {
    // Update summary with form data
    const summarySerial = document.getElementById('summary-serial');
    const summaryReason = document.getElementById('summary-reason');
    const summaryCurrentOwner = document.getElementById('summary-current-owner');
    const summaryNewName = document.getElementById('summary-new-name');
    const summaryNewContact = document.getElementById('summary-new-contact');
    const summaryTransferDate = document.getElementById('summary-transfer-date');
    
    if (summarySerial) summarySerial.textContent = document.getElementById('transfer-device-serial').value || '-';
    if (summaryReason) {
        const reasonSelect = document.getElementById('transfer-reason');
        summaryReason.textContent = reasonSelect.options[reasonSelect.selectedIndex].text || '-';
    }
    if (summaryCurrentOwner) summaryCurrentOwner.textContent = document.getElementById('current-owner-contact').value || '-';
    if (summaryNewName) summaryNewName.textContent = document.getElementById('new-owner-name').value || '-';
    if (summaryNewContact) summaryNewContact.textContent = document.getElementById('new-owner-contact').value || '-';
    if (summaryTransferDate) summaryTransferDate.textContent = document.getElementById('transfer-date').value || '-';
}

function validateTransferStep(step) {
    switch (step) {
        case 1:
            const currentOwnerContact = document.getElementById('current-owner-contact').value.trim();
            const deviceSerial = document.getElementById('transfer-device-serial').value.trim();
            
            if (!currentOwnerContact || currentOwnerContact.length < 5) {
                showToast('❌ Please enter a valid current owner contact', 'error');
                return false;
            }
            
            if (!deviceSerial || deviceSerial.length < 5) {
                showToast('❌ Please enter a valid device serial/IMEI number', 'error');
                return false;
            }
            
            // Verify device ownership before proceeding
            return verifyTransferDevice();
            
        case 2:
            const newOwnerName = document.getElementById('new-owner-name').value.trim();
            const newOwnerContact = document.getElementById('new-owner-contact').value.trim();
            const transferDate = document.getElementById('transfer-date').value;
            
            if (!newOwnerName || newOwnerName.length < 2) {
                showToast('❌ Please enter a valid new owner name', 'error');
                return false;
            }
            
            if (!newOwnerContact || newOwnerContact.length < 5) {
                showToast('❌ Please enter a valid new owner contact', 'error');
                return false;
            }
            
            if (!transferDate) {
                showToast('❌ Please select a transfer date', 'error');
                return false;
            }
            
            // Check if transfer date is not in the past
            const selectedDate = new Date(transferDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                showToast('❌ Transfer date cannot be in the past', 'error');
                return false;
            }
            
            return true;
            
        default:
            return true;
    }
}

function resetTransferForm() {
    currentTransferStep = 1;
    updateTransferStep();
    
    // Clear all form fields
    const transferForm = document.getElementById('transfer-form');
    if (transferForm) {
        transferForm.reset();
    }
    
    showToast('📋 Transfer form has been reset', 'info');
}

// Transfer verification with backend API
async function verifyTransferDevice() {
    const serialNumber = document.getElementById('transfer-device-serial').value.trim();
    const currentOwnerContact = document.getElementById('current-owner-contact').value.trim();
    
    if (!serialNumber || !currentOwnerContact) {
        showToast('❌ Please enter both serial number and contact information', 'error');
        return false;
    }
    
    try {
        const response = await fetch('/api/transfer/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serialNumber,
                currentOwnerContact
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data.verified) {
            showToast('✅ Device ownership verified! You can proceed with the transfer.', 'success');
            return true;
        } else {
            showToast(`❌ ${result.error || 'Verification failed'}`, 'error');
            return false;
        }
    } catch (error) {
        showToast('❌ Verification failed. Please try again.', 'error');
        console.error('Transfer verification error:', error);
        return false;
    }
}

// Submit transfer with backend API
async function submitTransfer() {
    // Validate all steps
    for (let i = 1; i <= 2; i++) {
        if (!validateTransferStep(i)) {
            currentTransferStep = i;
            updateTransferStep();
            return;
        }
    }
    
    // Check agreement
    const agreementChecked = document.getElementById('transfer-agreement').checked;
    if (!agreementChecked) {
        showToast('❌ Please confirm the transfer agreement', 'error');
        return;
    }
    
    const transferData = {
        currentOwnerContact: document.getElementById('current-owner-contact').value,
        serialNumber: document.getElementById('transfer-device-serial').value,
        transferReason: document.getElementById('transfer-reason').value,
        newOwnerName: document.getElementById('new-owner-name').value,
        newOwnerContact: document.getElementById('new-owner-contact').value,
        newOwnerEmail: document.getElementById('new-owner-email').value,
        transferDate: document.getElementById('transfer-date').value,
        transferNotes: document.getElementById('transfer-notes').value
    };
    
    const submitButton = document.querySelector('.transfer-submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Transfer...';
    submitButton.disabled = true;
    
    try {
        // Create transfer request
        const response = await fetch('/api/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transferData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const transfer = result.data.transfer;
            
            // Complete the transfer
            const completeResponse = await fetch(`/api/transfer/${transfer.id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ agreement: true })
            });
            
            const completeResult = await completeResponse.json();
            
            if (completeResult.success) {
                showToast('✅ Device ownership transfer completed successfully!', 'success');
                showToast(`📧 Transfer Code: ${transfer.transferCode}`, 'info');
                
                // Reset form and go back to step 1
                resetTransferForm();
            } else {
                showToast(`❌ ${completeResult.error || 'Transfer completion failed'}`, 'error');
            }
        } else {
            showToast(`❌ ${result.error || 'Transfer failed'}`, 'error');
        }
        
    } catch (error) {
        showToast('❌ Transfer failed. Please try again.', 'error');
        console.error('Transfer error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Add message to chat
function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    if (sender === 'bot') {
        // For bot messages, preserve formatting and add icon
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="message-content">${message}</div>
        `;
    } else {
        messageDiv.innerHTML = `<i class="fas fa-user"></i> ${message}`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Animate counters
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent) || 0;
                
                if (target > 0) {
                    animateCounter(counter, 0, target, 2000);
                }
                
                observer.unobserve(counter);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// Animate individual counter
function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = end;
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Show welcome message for returning users
function showWelcomeMessage() {
    setTimeout(() => {
        showToast('🛡️ Welcome back to Boltin Security!', 'success');
    }, 1000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const chatbot = document.getElementById('chatbot');
        if (chatbot.style.display === 'flex') {
            toggleChatbot();
        }
    }
    
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        showSearch();
    }
    
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        showRegistration();
    }
});

console.log('🛡️ Boltin Security Platform Ready!');

// Live Activity Feed
function startLiveActivityFeed() {
    const activities = [
        {
            icon: 'fas fa-shield-alt',
            type: 'success',
            device: 'iPhone 14 Pro',
            action: 'registered successfully',
            location: 'Lagos, Nigeria'
        },
        {
            icon: 'fas fa-check-circle',
            type: 'recovered',
            device: 'Samsung Galaxy S23',
            action: 'recovered and returned to owner',
            location: 'Abuja, Nigeria'
        },
        {
            icon: 'fas fa-exclamation-triangle',
            type: 'warning',
            device: 'MacBook Air M2',
            action: 'reported as stolen',
            location: 'Port Harcourt, Nigeria'
        },
        {
            icon: 'fas fa-shield-alt',
            type: 'success',
            device: 'iPad Pro 11"',
            action: 'registered successfully',
            location: 'Kano, Nigeria'
        },
        {
            icon: 'fas fa-check-circle',
            type: 'recovered',
            device: 'AirPods Pro 2',
            action: 'recovered and returned to owner',
            location: 'Ibadan, Nigeria'
        }
    ];
    
    let currentIndex = 0;
    
    function updateActivity() {
        const activityItems = document.querySelectorAll('.activity-item');
        
        activityItems.forEach((item, index) => {
            const activity = activities[(currentIndex + index) % activities.length];
            const icon = item.querySelector('.activity-icon i');
            const content = item.querySelector('.activity-content p');
            const time = item.querySelector('.activity-time');
            const location = item.querySelector('.activity-location');
            
            // Update content
            icon.className = activity.icon;
            content.innerHTML = `<strong>${activity.device}</strong> ${activity.action}`;
            time.textContent = `${Math.floor(Math.random() * 30) + 1} minutes ago`;
            location.textContent = activity.location;
            
            // Update styling
            const iconContainer = item.querySelector('.activity-icon');
            iconContainer.className = `activity-icon ${activity.type}`;
            item.className = `activity-item ${activity.type}`;
        });
        
        currentIndex = (currentIndex + 1) % activities.length;
    }
    
    // Update every 10 seconds
    setInterval(updateActivity, 10000);
}

// Setup scroll indicator
function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Also add touch support for mobile
        scrollIndicator.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, { passive: false });
    }
}

// Enhanced statistics with real-time updates
function updateLiveStats() {
    const registeredElement = document.getElementById('registered-count');
    const recoveredElement = document.getElementById('recovered-count');
    
    if (registeredElement && recoveredElement) {
        // Simulate live updates
        const currentRegistered = parseInt(registeredElement.textContent) || 1247;
        const currentRecovered = parseInt(recoveredElement.textContent) || 1089;
        
        // Small random increments
        if (Math.random() < 0.3) {
            const newRegistered = currentRegistered + Math.floor(Math.random() * 3) + 1;
            const newRecovered = currentRecovered + Math.floor(Math.random() * 2);
            
            animateCounter(registeredElement, currentRegistered, newRegistered, 1000);
            animateCounter(recoveredElement, currentRecovered, newRecovered, 1000);
        }
    }
}

// Start live stats updates
setInterval(updateLiveStats, 30000); // Update every 30 seconds

// Enhanced form validation with real-time feedback
function enhanceFormValidation() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
        });
        
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    // Add visual feedback to all buttons
    const buttons = document.querySelectorAll('button, .button, .cta-button, .action-button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state briefly for feedback
            const originalText = this.innerHTML;
            const isSubmitButton = this.type === 'submit' || this.classList.contains('submit-button');
            
            if (isSubmitButton) {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.disabled = true;
                
                // Reset after a short delay (form submission will handle longer states)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 1000);
            } else {
                // Non-submit buttons get quick visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    // Remove existing validation classes
    field.classList.remove('valid', 'invalid');
    
    if (isRequired && !value) {
        field.classList.add('invalid');
        return false;
    } else if (value) {
        // Specific validations
        if (field.type === 'email' && !isValidEmail(value)) {
            field.classList.add('invalid');
            return false;
        }
        
        if (field.name === 'serialNumber' && value.length < 5) {
            field.classList.add('invalid');
            return false;
        }
        
        field.classList.add('valid');
        return true;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Test all button functionality (for debugging)
function testAllButtons() {
    console.log('🔧 Testing all button functionality...');
    
    const tests = [
        { selector: 'button[onclick="showRegistration()"]', name: 'Registration buttons' },
        { selector: 'button[onclick="showSearch()"]', name: 'Search buttons' },
        { selector: 'button[onclick="showLostReport()"]', name: 'Report buttons' },
        { selector: 'button[onclick="showTransfer()"]', name: 'Transfer buttons' },
        { selector: 'button[onclick="toggleChatbot()"]', name: 'Chatbot buttons' },
        { selector: 'button[onclick="nextTransferStep()"]', name: 'Next step buttons' },
        { selector: 'button[onclick="previousTransferStep()"]', name: 'Previous step buttons' },
        { selector: 'button[onclick="submitTransfer()"]', name: 'Submit transfer buttons' },
        { selector: '.cta-button[href="#register"]', name: 'Hero registration CTA' },
        { selector: '.cta-button[href="#search"]', name: 'Hero search CTA' },
        { selector: '.nav-link[href="#register"]', name: 'Nav registration link' },
        { selector: '.nav-link[href="#search"]', name: 'Nav search link' },
        { selector: '.nav-link[href="#transfer"]', name: 'Nav transfer link' },
        { selector: '#registration-form', name: 'Registration form' },
        { selector: '#search-form', name: 'Search form' },
        { selector: '#chat-form', name: 'Chat form' },
        { selector: '#transfer-form', name: 'Transfer form' }
    ];
    
    tests.forEach(test => {
        const elements = document.querySelectorAll(test.selector);
        if (elements.length > 0) {
            console.log(`✅ ${test.name}: ${elements.length} element(s) found`);
        } else {
            console.log(`❌ ${test.name}: No elements found`);
        }
    });
    
    // Test function availability
    const functions = [
        'showRegistration', 'showSearch', 'showLostReport', 'showTransfer', 
        'toggleChatbot', 'nextTransferStep', 'previousTransferStep', 'submitTransfer',
        'handleRegistration', 'handleSearch', 'handleChatMessage'
    ];
    
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ Function ${funcName}: Available`);
        } else {
            console.log(`❌ Function ${funcName}: Missing`);
        }
    });
    
    console.log('🔧 Button functionality test complete!');
}

// Call test function after DOM is loaded (for debugging)
// Uncomment the line below to run tests
setTimeout(testAllButtons, 1000);

// Add typing effect for hero subtitle
function addTypingEffect() {
    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        
        let i = 0;
        const typing = setInterval(() => {
            subtitle.textContent += text.charAt(i);
            i++;
            
            if (i >= text.length) {
                clearInterval(typing);
            }
        }, 50);
    }
}

// Start typing effect after a delay
setTimeout(addTypingEffect, 1000);

// Mobile-specific enhancements
function setupMobileEnhancements() {
    // Prevent zoom on form inputs on iOS
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    // Add touch feedback to all buttons
    const buttons = document.querySelectorAll('button, .button, .cta-button, .action-button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.style.opacity = '1';
        }, { passive: true });
        
        // Prevent double-tap zoom on buttons
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
    });
    
    // Enhanced mobile menu handling
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        // Add touch support for hamburger menu
        hamburger.addEventListener('touchstart', function(e) {
            e.preventDefault();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        }, { passive: false });
        
        // Close menu when clicking outside
        document.addEventListener('touchstart', function(e) {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }, { passive: true });
    }
    
    // Enhanced form validation for mobile
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Better mobile focus handling
        input.addEventListener('focus', function() {
            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        // Mobile-specific input formatting
        if (input.type === 'tel' || input.name === 'contact') {
            input.addEventListener('input', function() {
                // Auto-format phone numbers
                let value = this.value.replace(/\D/g, '');
                if (value.length > 0) {
                    this.value = value;
                }
            });
        }
    });
    
    // Mobile-optimized image upload
    const imageUploadArea = document.querySelector('.image-upload-area');
    if (imageUploadArea) {
        // Add touch feedback
        imageUploadArea.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        imageUploadArea.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        }, { passive: true });
    }
    
    // Optimize chatbot for mobile
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('focus', function() {
            // Scroll chatbot into view on mobile
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }
    
    // Add swipe gesture support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;
        
        let diffX = touchStartX - touchEndX;
        let diffY = touchStartY - touchEndY;
        
        // Swipe left to open mobile menu
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX < 0 && touchStartX < 50) { // Swipe right from left edge
                const navMenu = document.querySelector('.nav-menu');
                const hamburger = document.querySelector('.hamburger');
                if (navMenu && hamburger) {
                    navMenu.classList.add('active');
                    hamburger.classList.add('active');
                }
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
    
    console.log('📱 Mobile enhancements initialized');
}

// Authentication Functions

// Check authentication status on page load
function checkAuthStatus() {
    authToken = localStorage.getItem('boltin_token');
    const userData = localStorage.getItem('boltin_user_data');
    
    if (authToken && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIForAuthenticatedUser();
            // Verify token is still valid
            verifyToken();
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else {
        updateUIForGuestUser();
    }
}

// Verify token with backend
async function verifyToken() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token verification failed');
        }
        
        const result = await response.json();
        if (result.success) {
            currentUser = result.data.user;
            localStorage.setItem('boltin_user_data', JSON.stringify(currentUser));
            updateUIForAuthenticatedUser();
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        logout();
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userNameDisplay = document.getElementById('user-name-display');
    const authRequiredItems = document.querySelectorAll('.auth-required');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (userNameDisplay && currentUser) {
        userNameDisplay.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    
    // Show auth-required menu items
    authRequiredItems.forEach(item => {
        item.style.display = 'block';
    });
}

// Update UI for guest user
function updateUIForGuestUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const authRequiredItems = document.querySelectorAll('.auth-required');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    
    // Hide auth-required menu items
    authRequiredItems.forEach(item => {
        item.style.display = 'none';
    });
}

// Show login form
function showLoginForm() {
    const modal = document.getElementById('auth-modal');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const modalTitle = document.getElementById('auth-modal-title');
    
    if (modal && loginContainer && registerContainer) {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        modalTitle.textContent = 'Welcome Back to BOLTIN';
        modal.style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }
}

// Show register form
function showRegisterForm() {
    const modal = document.getElementById('auth-modal');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const modalTitle = document.getElementById('auth-modal-title');
    
    if (modal && loginContainer && registerContainer) {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        modalTitle.textContent = 'Join BOLTIN Security';
        modal.style.display = 'flex';
        
        setTimeout(() => {
            document.getElementById('register-firstname').focus();
        }, 100);
    }
}

// Switch to register form
function switchToRegister() {
    showRegisterForm();
}

// Switch to login form
function switchToLogin() {
    showLoginForm();
}

// Close authentication modal
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        button.className = 'fas fa-eye';
    }
}

// Toggle user dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Logout function
function logout() {
    // Clear stored data
    localStorage.removeItem('boltin_token');
    localStorage.removeItem('boltin_user_data');
    authToken = null;
    currentUser = null;
    
    // Update UI
    updateUIForGuestUser();
    
    // Hide dashboard if open
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }
    
    // Go to home section
    document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
    
    showToast('👋 You have been logged out successfully', 'info');
}

// Show user dashboard
function showDashboard() {
    if (!currentUser) {
        showToast('❌ Please login to access dashboard', 'error');
        showLoginForm();
        return;
    }
    
    hideAllSections();
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.style.display = 'block';
        dashboard.scrollIntoView({ behavior: 'smooth' });
        loadUserDashboard();
        setupDashboardMenuHandlers();
    }
}

// Setup dashboard menu handlers
function setupDashboardMenuHandlers() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchDashboardSection(section);
        });
    });
}

// Switch dashboard sections
function switchDashboardSection(sectionName) {
    // Remove active class from menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked menu item
    const activeMenuItem = document.querySelector(`.menu-item[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Hide all section contents
    document.querySelectorAll('.dashboard-section-content').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const activeSection = document.getElementById(`${sectionName}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'devices':
            loadUserDevices();
            break;
        case 'register':
            initializeDashboardRegistration();
            break;
        case 'search':
            initializeDashboardSearch();
            break;
        case 'reports':
            loadUserReports();
            break;
        case 'transfers':
            loadUserTransfers();
            break;
        case 'profile':
            loadUserProfile();
            break;
        case 'security':
            loadSecuritySettings();
            break;
    }
}

// Load user dashboard data
async function loadUserDashboard() {
    if (!authToken || !currentUser) return;
    
    try {
        // Load user statistics
        const statsResponse = await fetch('/api/auth/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            if (statsResult.success) {
                updateDashboardStats(statsResult.data.stats);
            }
        }
        
        // Load user devices
        loadUserDevices();
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    const deviceCount = document.getElementById('user-device-count');
    const reportCount = document.getElementById('user-report-count');
    const transferCount = document.getElementById('user-transfer-count');
    const joinDate = document.getElementById('user-join-date');
    
    if (deviceCount) deviceCount.textContent = stats.devicesRegistered || 0;
    if (reportCount) reportCount.textContent = stats.reportsCreated || 0;
    if (transferCount) transferCount.textContent = stats.transfersCompleted || 0;
    if (joinDate && stats.joinDate) {
        const date = new Date(stats.joinDate);
        joinDate.textContent = date.toLocaleDateString();
    }
}

// Setup authentication forms
function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('user-register-form');
    const cameraSignatureInput = document.getElementById('camera-signature');
    const registerPasswordInput = document.getElementById('register-password');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (cameraSignatureInput) {
        cameraSignatureInput.addEventListener('change', handleCameraSignatureUpload);
    }
    
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('auth-modal');
        if (e.target === modal) {
            closeAuthModal();
        }
    });
    
    // Close user dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        if (dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: document.getElementById('remember-me').checked
    };
    
    const submitButton = e.target.querySelector('.auth-submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store auth data
            authToken = result.data.token;
            currentUser = result.data.user;
            localStorage.setItem('boltin_token', authToken);
            localStorage.setItem('boltin_user_data', JSON.stringify(currentUser));
            
            showToast('✅ Login successful! Welcome back.', 'success');
            closeAuthModal();
            updateUIForAuthenticatedUser();
            
            // Load user dashboard data
            loadUserDashboard();
            
        } else {
            showToast(`❌ ${result.error || 'Login failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Login failed. Please try again.', 'error');
        console.error('Login error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        address: formData.get('address')
    };
    
    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
        showToast('❌ Passwords do not match', 'error');
        return;
    }
    
    // Check terms agreement
    if (!document.getElementById('terms-agreement').checked) {
        showToast('❌ Please agree to the terms of service', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('.auth-submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store auth data
            authToken = result.data.token;
            currentUser = result.data.user;
            localStorage.setItem('boltin_token', authToken);
            localStorage.setItem('boltin_user_data', JSON.stringify(currentUser));
            
            showToast('✅ Account created successfully! Welcome to BOLTIN.', 'success');
            closeAuthModal();
            updateUIForAuthenticatedUser();
            
            // Show welcome dashboard
            showDashboard();
            
        } else {
            showToast(`❌ ${result.error || 'Registration failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Registration failed. Please try again.', 'error');
        console.error('Registration error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Load user devices
async function loadUserDevices() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/devices/user/my-devices', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayUserDevices(result.data.devices);
            }
        }
    } catch (error) {
        console.error('Error loading user devices:', error);
    }
}

// Display user devices in dashboard
function displayUserDevices(devices) {
    const devicesContainer = document.getElementById('user-devices-list');
    if (!devicesContainer) return;
    
    if (devices.length === 0) {
        devicesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mobile-alt"></i>
                <h3>No Devices Registered</h3>
                <p>Start protecting your devices by registering them with BOLTIN</p>
                <button class="cta-button primary" onclick="showRegistration()">
                    <i class="fas fa-plus"></i>
                    Register Your First Device
                </button>
            </div>
        `;
        return;
    }
    
    devicesContainer.innerHTML = devices.map(device => `
        <div class="device-card">
            <div class="device-header">
                <div class="device-icon">
                    <i class="fas fa-${getDeviceIcon(device.deviceType)}"></i>
                </div>
                <div class="device-status ${device.status || 'safe'}">
                    ${(device.status || 'safe').toUpperCase()}
                </div>
            </div>
            <div class="device-info">
                <h3>${device.brand} ${device.model}</h3>
                <p><strong>Type:</strong> ${device.deviceType}</p>
                <p><strong>Serial:</strong> ${device.serialNumber}</p>
                <p><strong>Registered:</strong> ${new Date(device.registeredAt).toLocaleDateString()}</p>
                ${device.cameraSignature ? '<p><strong>Camera Signature:</strong> ✅ Added</p>' : ''}
            </div>
            <div class="device-actions">
                <button class="device-action-btn" onclick="editDevice('${device.id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="device-action-btn" onclick="viewDevice('${device.id}')">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button class="device-action-btn" onclick="reportDevice('${device.serialNumber}')">
                    <i class="fas fa-exclamation-triangle"></i>
                    Report
                </button>
            </div>
        </div>
    `).join('');
}

// Get device icon based on type
function getDeviceIcon(deviceType) {
    const icons = {
        smartphone: 'mobile-alt',
        laptop: 'laptop',
        tablet: 'tablet-alt',
        smartwatch: 'clock',
        headphones: 'headphones',
        camera: 'camera',
        other: 'device'
    };
    return icons[deviceType] || 'device';
}

// Setup dashboard menu
function setupDashboardMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sectionContents = document.querySelectorAll('.dashboard-section-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            menuItems.forEach(mi => mi.classList.remove('active'));
            sectionContents.forEach(sc => sc.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding section
            const section = this.dataset.section;
            const sectionContent = document.getElementById(`${section}-section`);
            if (sectionContent) {
                sectionContent.classList.add('active');
            }
        });
    });
}

// Password strength checker
function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let text = 'Too Weak';
    
    if (password.length >= 6) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    strengthBar.className = 'strength-bar';
    
    switch (strength) {
        case 0:
        case 1:
            strengthBar.classList.add('weak');
            text = 'Very Weak';
            break;
        case 2:
            strengthBar.classList.add('fair');
            text = 'Weak';
            break;
        case 3:
            strengthBar.classList.add('good');
            text = 'Good';
            break;
        case 4:
        case 5:
            strengthBar.classList.add('strong');
            text = 'Strong';
            break;
    }
    
    strengthText.textContent = text;
}

// Social login functions
function socialLogin(provider) {
    showToast(`🔧 ${provider} login will be available soon!`, 'info');
}

// Profile functions
function showProfile() {
    showDashboard();
    // Switch to profile section
    setTimeout(() => {
        const profileMenuItem = document.querySelector('.menu-item[data-section="profile"]');
        if (profileMenuItem) {
            profileMenuItem.click();
        }
    }, 500);
}
    const deviceTypeSelect = document.getElementById('device-type');
    const cameraSignatureGroup = document.getElementById('camera-signature-group');
    
    if (deviceTypeSelect && cameraSignatureGroup) {
        deviceTypeSelect.addEventListener('change', function() {
            const selectedType = this.value.toLowerCase();
            const showCameraSignature = ['smartphone', 'camera', 'tablet'].includes(selectedType);
            
            cameraSignatureGroup.style.display = showCameraSignature ? 'block' : 'none';
        });
    }
}

// Trigger camera signature upload
function triggerSignatureUpload() {
    const fileInput = document.getElementById('camera-signature');
    if (fileInput) {
        fileInput.click();
    }
}

// Handle camera signature upload
function handleCameraSignatureUpload(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('signature-preview');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <div class="signature-preview-item">
                    <img src="${e.target.result}" alt="Camera Signature">
                    <p>Camera signature uploaded successfully</p>
                    <button type="button" class="remove-signature-btn" onclick="removeSignature()">
                        <i class="fas fa-times"></i>
                        Remove
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Remove camera signature
function removeSignature() {
    const previewContainer = document.getElementById('signature-preview');
    const fileInput = document.getElementById('camera-signature');
    
    if (previewContainer) previewContainer.innerHTML = '';
    if (fileInput) fileInput.value = '';
}

// Location permission handling
function handleLocationPermission() {
    const checkbox = document.getElementById('enable-location');
    
    if (checkbox.checked) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    showToast('✅ Location access granted for enhanced security', 'success');
                    // Store location for search context
                    localStorage.setItem('boltin_location', JSON.stringify({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        timestamp: Date.now()
                    }));
                },
                function(error) {
                    checkbox.checked = false;
                    showToast('❌ Location access denied. Enable in browser settings for enhanced security.', 'warning');
                    console.error('Location error:', error);
                }
            );
        } else {
            checkbox.checked = false;
            showToast('❌ Geolocation not supported by this browser', 'error');
        }
    } else {
        localStorage.removeItem('boltin_location');
        showToast('📍 Location tracking disabled', 'info');
    }
}

// Close location map
function closeLocationMap() {
    const mapContainer = document.getElementById('location-map-container');
    if (mapContainer) {
        mapContainer.style.display = 'none';
    }
}

// Device Profiles and AI Suggestions System

// Device profiles for comprehensive identification
const deviceProfiles = {
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
        additionalInfo: ['Storage Capacity', 'Color', 'Operating System Version', 'Network Carrier']
    },
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
            }
        ],
        additionalInfo: ['Year of Manufacture', 'Mileage/Odometer Reading', 'Fuel Type', 'Transmission Type']
    },
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
        additionalInfo: ['Engine Capacity (CC)', 'Year of Manufacture', 'Mileage']
    },
    laptop: {
        name: 'Laptop',
        icon: 'fas fa-laptop',
        primaryId: 'Serial Number',
        identificationFields: [
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
            }
        ],
        additionalInfo: ['RAM Size', 'Storage Type & Size', 'Processor Model', 'Operating System']
    },
    tablet: {
        name: 'Tablet',
        icon: 'fas fa-tablet-alt',
        primaryId: 'Serial Number',
        identificationFields: [
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
        additionalInfo: ['Storage Capacity', 'Screen Size', 'Cellular Capability']
    },
    smartwatch: {
        name: 'Smartwatch',
        icon: 'fas fa-clock',
        primaryId: 'Serial Number',
        identificationFields: [
            {
                name: 'imei',
                label: 'IMEI (Cellular Models)',
                type: 'text',
                required: false,
                pattern: '^[0-9]{15}$',
                placeholder: '15-digit IMEI (if cellular)',
                description: 'IMEI for cellular smartwatches',
                aiSuggestion: 'Essential for cellular smartwatches with independent connectivity'
            }
        ],
        additionalInfo: ['Screen Size', 'Strap Type', 'Health Sensors']
    },
    camera: {
        name: 'Camera',
        icon: 'fas fa-camera',
        primaryId: 'Serial Number',
        identificationFields: [
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
        additionalInfo: ['Sensor Type', 'Megapixel Count', 'Video Capabilities']
    },
    gaming_console: {
        name: 'Gaming Console',
        icon: 'fas fa-gamepad',
        primaryId: 'Serial Number',
        identificationFields: [
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
        additionalInfo: ['Storage Capacity', 'Controller Serial Numbers', 'Gaming Account']
    },
    headphones: {
        name: 'Headphones/Audio',
        icon: 'fas fa-headphones',
        primaryId: 'Serial Number',
        identificationFields: [
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
        additionalInfo: ['Driver Size', 'Frequency Response', 'Connectivity Type']
    },
    other: {
        name: 'Other Device',
        icon: 'fas fa-microchip',
        primaryId: 'Serial Number',
        identificationFields: [
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
        additionalInfo: ['Manufacturing Date', 'Firmware Version']
    }
};

// Update device fields when device type changes
function updateDeviceFields() {
    const deviceType = document.getElementById('device-type').value;
    const primarySerialLabel = document.querySelector('label[for="serial-number"]');
    const primarySerialHint = document.getElementById('primary-serial-hint');
    const identificationContainer = document.getElementById('identification-fields-container');
    const cameraSignatureGroup = document.getElementById('camera-signature-group');
    
    if (!deviceType) {
        identificationContainer.style.display = 'none';
        if (cameraSignatureGroup) cameraSignatureGroup.style.display = 'none';
        return;
    }
    
    const profile = deviceProfiles[deviceType] || deviceProfiles.other;
    
    // Update primary serial field label
    if (primarySerialLabel) {
        primarySerialLabel.innerHTML = `${profile.primaryId} *`;
    }
    if (primarySerialHint) {
        primarySerialHint.textContent = `Primary identifier for ${profile.name}`;
    }
    
    // Show camera signature for applicable devices
    if (cameraSignatureGroup) {
        const showCameraSignature = ['smartphone', 'camera', 'tablet'].includes(deviceType);
        cameraSignatureGroup.style.display = showCameraSignature ? 'block' : 'none';
    }
    
    // Generate identification fields
    generateIdentificationFields(profile, deviceType);
    
    // Update AI suggestions
    updateAISuggestions();
    
    // Add device type class for styling
    const registrationSection = document.getElementById('register');
    if (registrationSection) {
        registrationSection.className = `registration-section device-type-${deviceType}`;
    }
}

// Generate dynamic identification fields
function generateIdentificationFields(profile, deviceType) {
    const container = document.getElementById('identification-fields-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="identification-header">
            <h3><i class="${profile.icon}"></i> ${profile.name} Identification Details</h3>
            <p>Provide comprehensive identification information for better security and recovery</p>
        </div>
        <div class="identification-fields">
            ${profile.identificationFields.map(field => `
                <div class="identification-field">
                    <div class="form-group">
                        <label for="id-${field.name}">
                            <span class="field-icon"><i class="fas fa-key"></i></span>
                            ${field.label}
                            ${field.required ? '<span class="required-indicator">*</span>' : ''}
                        </label>
                        <input type="${field.type}" 
                               id="id-${field.name}" 
                               name="identificationNumbers[${field.name}]" 
                               placeholder="${field.placeholder}"
                               ${field.required ? 'required' : ''}
                               ${field.pattern ? `pattern="${field.pattern}"` : ''}
                               onchange="validateIdentificationField('${field.name}', this.value, '${deviceType}')"
                               oninput="validateIdentificationField('${field.name}', this.value, '${deviceType}')">
                        <small class="field-hint">${field.description}</small>
                        <div class="field-validation" id="validation-${field.name}"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${profile.additionalInfo.length > 0 ? `
            <div class="additional-info-section">
                <div class="additional-info-header">
                    <h4>Additional Information to Consider</h4>
                </div>
                <div class="additional-info-tags">
                    ${profile.additionalInfo.map(info => `<span class="info-tag">${info}</span>`).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    container.style.display = 'block';
    container.classList.add('loaded');
}

// Validate identification fields
function validateIdentificationField(fieldName, value, deviceType) {
    const profile = deviceProfiles[deviceType] || deviceProfiles.other;
    const field = profile.identificationFields.find(f => f.name === fieldName);
    const validationDiv = document.getElementById(`validation-${fieldName}`);
    const inputElement = document.getElementById(`id-${fieldName}`);
    
    if (!field || !validationDiv || !inputElement) return;
    
    let isValid = true;
    let message = '';
    
    // Check if required field is empty
    if (field.required && (!value || value.trim() === '')) {
        isValid = false;
        message = `${field.label} is required`;
    }
    // Check pattern validation
    else if (field.pattern && value && value.trim() !== '') {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
            isValid = false;
            message = `Invalid format for ${field.label}`;
        }
    }
    // Special validations
    else if (fieldName === 'imei' && value && value.trim() !== '') {
        const imeiValidation = validateIMEI(value);
        isValid = imeiValidation.valid;
        message = imeiValidation.message;
    }
    else if (fieldName === 'vin' && value && value.trim() !== '') {
        const vinValidation = validateVIN(value);
        isValid = vinValidation.valid;
        message = vinValidation.message;
    }
    
    // Update UI
    inputElement.classList.remove('valid', 'invalid');
    inputElement.classList.add(isValid ? 'valid' : 'invalid');
    
    if (value && value.trim() !== '') {
        validationDiv.innerHTML = `
            <i class="validation-icon fas fa-${isValid ? 'check-circle' : 'exclamation-circle'}"></i>
            <span class="validation-${isValid ? 'valid' : 'invalid'}">${message || (isValid ? 'Valid' : 'Invalid')}</span>
        `;
        validationDiv.style.display = 'flex';
    } else {
        validationDiv.style.display = 'none';
    }
}

// IMEI validation using Luhn algorithm
function validateIMEI(imei) {
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
function validateVIN(vin) {
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
        return { valid: false, message: 'VIN must be 17 characters (no I, O, Q allowed)' };
    }
    return { valid: true, message: 'Valid VIN format' };
}

// Update AI suggestions based on device type and brand
function updateAISuggestions() {
    const deviceType = document.getElementById('device-type').value;
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const suggestionsPanel = document.getElementById('ai-suggestions-panel');
    const suggestionsContent = document.getElementById('ai-suggestions-content');
    
    if (!deviceType || !suggestionsPanel || !suggestionsContent) return;
    
    const profile = deviceProfiles[deviceType] || deviceProfiles.other;
    const suggestions = generateAISuggestions(deviceType, brand, model, profile);
    
    suggestionsContent.innerHTML = `
        <div class="ai-suggestion-item critical-field">
            <div class="suggestion-header">
                <i class="fas fa-exclamation-triangle"></i>
                Critical Identification
            </div>
            <div class="suggestion-content">
                Primary identifier: <strong>${profile.primaryId}</strong><br>
                ${suggestions.criticalFields.map(field => `• ${field.label}: ${field.reason}`).join('<br>')}
            </div>
        </div>
        
        ${suggestions.recommendations.length > 0 ? `
            <div class="ai-suggestion-item recommendation">
                <div class="suggestion-header">
                    <i class="fas fa-lightbulb"></i>
                    Smart Recommendations
                </div>
                <div class="suggestion-content">
                    ${suggestions.recommendations.map(rec => `• ${rec}`).join('<br>')}
                </div>
            </div>
        ` : ''}
        
        ${suggestions.securityTips.length > 0 ? `
            <div class="ai-suggestion-item security-tip">
                <div class="suggestion-header">
                    <i class="fas fa-shield-alt"></i>
                    Security Tips
                </div>
                <div class="suggestion-content">
                    ${suggestions.securityTips.map(tip => `• ${tip}`).join('<br>')}
                </div>
            </div>
        ` : ''}
    `;
    
    suggestionsPanel.style.display = 'block';
}

// Generate AI suggestions based on device type and brand
function generateAISuggestions(deviceType, brand, model, profile) {
    const suggestions = {
        criticalFields: [],
        recommendations: [],
        securityTips: []
    };
    
    // Add critical identification fields
    profile.identificationFields.forEach(field => {
        if (field.required) {
            suggestions.criticalFields.push({
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
    
    if (brand.toLowerCase().includes('google')) {
        suggestions.recommendations.push('Google Find My Device service should be enabled');
        suggestions.recommendations.push('Google account recovery options are important');
    }
    
    // Generate device-specific security tips
    switch (deviceType.toLowerCase()) {
        case 'smartphone':
            suggestions.securityTips.push('Enable remote wipe and location tracking');
            suggestions.securityTips.push('Register with carrier for IMEI blocking');
            suggestions.securityTips.push('Set up strong screen lock and biometric authentication');
            break;
        case 'car':
        case 'motorcycle':
            suggestions.securityTips.push('Install GPS tracking system for real-time location');
            suggestions.securityTips.push('Keep registration documents in secure location');
            suggestions.securityTips.push('Consider steering wheel lock or other physical security');
            break;
        case 'laptop':
            suggestions.securityTips.push('Enable disk encryption and remote wipe capabilities');
            suggestions.securityTips.push('Install tracking software like Prey or LoJack');
            suggestions.securityTips.push('Use strong login passwords and two-factor authentication');
            break;
        case 'camera':
            suggestions.securityTips.push('Register camera and lens serial numbers separately');
            suggestions.securityTips.push('Use UV security marking on non-visible areas');
            suggestions.securityTips.push('Keep purchase receipts and warranty documents');
            break;
    }
    
    return suggestions;
}

// Dashboard-specific redirect function
function redirectToDashboard(section) {
    if (!currentUser || !authToken) {
        showToast('👉 Please login to access dashboard features', 'info');
        showLoginForm();
        return;
    }
    
    showDashboard();
    setTimeout(() => {
        switchDashboardSection(section);
    }, 300);
}

// Load user reports
async function loadUserReports() {
    if (!authToken || !currentUser) return;
    
    try {
        const response = await fetch('/api/reports/user', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayUserReports(result.data.reports);
            }
        }
    } catch (error) {
        console.error('Load user reports error:', error);
    }
}

// Display user reports
function displayUserReports(reports) {
    const reportsContainer = document.getElementById('user-reports-list');
    if (!reportsContainer) return;
    
    if (!reports || reports.length === 0) {
        reportsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No Reports Found</h3>
                <p>You haven't filed any device reports yet.</p>
                <button class="add-report-btn" onclick="showDashboardReportForm()">
                    <i class="fas fa-plus"></i>
                    Report a Device
                </button>
            </div>
        `;
        return;
    }
    
    reportsContainer.innerHTML = reports.map(report => `
        <div class="report-card ${report.reportType}">
            <div class="report-header">
                <div class="report-icon">
                    <i class="fas fa-${report.reportType === 'stolen' ? 'ban' : 'question-circle'}"></i>
                </div>
                <div class="report-status">
                    <span class="status-badge ${report.reportType}">${report.reportType.toUpperCase()}</span>
                </div>
            </div>
            <div class="report-info">
                <h3>Device Report</h3>
                <p><strong>Serial Number:</strong> ${report.serialNumber}</p>
                <p><strong>Incident Date:</strong> ${new Date(report.incidentDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Reported:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
                ${report.policeReportNumber ? `<p><strong>Police Report:</strong> ${report.policeReportNumber}</p>` : ''}
            </div>
            <div class="report-actions">
                <button class="report-action-btn" onclick="viewReport('${report.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                <button class="report-action-btn" onclick="updateReport('${report.id}')">
                    <i class="fas fa-edit"></i>
                    Update
                </button>
            </div>
        </div>
    `).join('');
}

// Load user transfers
async function loadUserTransfers() {
    if (!authToken || !currentUser) return;
    
    try {
        const response = await fetch('/api/transfers/user', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                displayUserTransfers(result.data.transfers);
            }
        }
    } catch (error) {
        console.error('Load user transfers error:', error);
    }
}

// Display user transfers
function displayUserTransfers(transfers) {
    // For now, show the transfer form since we're implementing active transfers
    // In the future, this could show transfer history
    initializeDashboardTransfer();
}

// Load user profile
async function loadUserProfile() {
    if (!authToken || !currentUser) return;
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                populateProfileForm(result.data.user);
            }
        }
    } catch (error) {
        console.error('Load user profile error:', error);
    }
}

// Populate profile form
function populateProfileForm(user) {
    const fields = {
        'profile-firstname': user.firstName,
        'profile-lastname': user.lastName,
        'profile-email': user.email,
        'profile-phone': user.phone,
        'profile-address': user.address
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    });
}

// Load security settings
function loadSecuritySettings() {
    // Initialize security settings interface
    // This function would typically load 2FA status, login history, etc.
    showToast('🔧 Security settings will be implemented soon', 'info');
}

// Show dashboard report form
function showDashboardReportForm(prefilledSerial = '') {
    const formContainer = document.getElementById('dashboard-report-form-container');
    const reportsList = document.getElementById('user-reports-list');
    
    if (formContainer) {
        formContainer.style.display = 'block';
        if (reportsList) {
            reportsList.style.display = 'none';
        }
        
        // Pre-fill serial if provided
        if (prefilledSerial) {
            const serialField = document.getElementById('dash-report-serial');
            if (serialField) {
                serialField.value = prefilledSerial;
            }
        }
        
        // Pre-fill user contact
        if (currentUser) {
            const contactField = document.getElementById('dash-report-contact');
            if (contactField && !contactField.value) {
                contactField.value = currentUser.email;
            }
        }
        
        // Set default incident date to today
        const dateField = document.getElementById('dash-incident-date');
        if (dateField && !dateField.value) {
            dateField.value = new Date().toISOString().split('T')[0];
        }
        
        // Initialize form handler
        const form = document.getElementById('dashboard-report-form');
        if (form && !form.dataset.initialized) {
            form.addEventListener('submit', handleDashboardReport);
            form.dataset.initialized = 'true';
        }
    }
}

// Hide dashboard report form
function hideDashboardReportForm() {
    const formContainer = document.getElementById('dashboard-report-form-container');
    const reportsList = document.getElementById('user-reports-list');
    
    if (formContainer) {
        formContainer.style.display = 'none';
        if (reportsList) {
            reportsList.style.display = 'block';
        }
    }
}

// Handle dashboard report submission
async function handleDashboardReport(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const reportData = {
        serialNumber: formData.get('serialNumber').trim().toUpperCase(),
        ownerContact: formData.get('ownerContact').trim(),
        reportType: formData.get('reportType'),
        incidentDate: formData.get('incidentDate'),
        location: formData.get('location').trim(),
        description: formData.get('description').trim(),
        policeReportNumber: formData.get('policeReportNumber')?.trim() || ''
    };
    
    const submitButton = e.target.querySelector('.submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(reportData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Report submitted successfully!', 'success');
            e.target.reset();
            hideDashboardReportForm();
            loadUserReports(); // Reload reports list
        } else {
            showToast(`❌ ${result.error || 'Report submission failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Report submission failed. Please try again.', 'error');
        console.error('Dashboard report error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Initialize dashboard registration form
function initializeDashboardRegistration() {
    const form = document.getElementById('dashboard-registration-form');
    if (form) {
        form.addEventListener('submit', handleDashboardRegistration);
        
        // Pre-populate owner name and contact from current user
        if (currentUser) {
            const ownerNameField = document.getElementById('dash-owner-name');
            const contactField = document.getElementById('dash-contact');
            
            if (ownerNameField && !ownerNameField.value) {
                ownerNameField.value = `${currentUser.firstName} ${currentUser.lastName}`;
            }
            if (contactField && !contactField.value) {
                contactField.value = currentUser.email;
            }
        }
    }
}

// Handle dashboard registration
async function handleDashboardRegistration(e) {
    e.preventDefault();
    
    if (!currentUser || !authToken) {
        showToast('❌ Please login to register devices', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    
    const deviceData = {
        ownerName: formData.get('ownerName'),
        contact: formData.get('contact'),
        deviceType: formData.get('deviceType'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        serialNumber: formData.get('serialNumber'),
        description: formData.get('description')
    };
    
    // Collect identification numbers from dashboard dynamic fields
    const identificationNumbers = {};
    const deviceType = deviceData.deviceType;
    
    if (deviceType && deviceProfiles[deviceType]) {
        const profile = deviceProfiles[deviceType];
        
        profile.identificationFields.forEach(field => {
            const fieldElement = document.getElementById(`dash-id-${field.name}`);
            if (fieldElement && fieldElement.value.trim()) {
                identificationNumbers[field.name] = fieldElement.value.trim();
            }
        });
        
        // Add identification numbers to device data
        if (Object.keys(identificationNumbers).length > 0) {
            deviceData.identificationNumbers = identificationNumbers;
        }
    }
    
    if (!validateRegistrationForm(deviceData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(deviceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Device registered successfully!', 'success');
            e.target.reset();
            
            // Clear dashboard dynamic fields
            const dashIdentificationContainer = document.getElementById('dash-identification-fields-container');
            if (dashIdentificationContainer) {
                dashIdentificationContainer.innerHTML = '';
            }
            
            // Switch back to devices section and reload
            switchDashboardSection('devices');
            
        } else {
            showToast(`❌ ${result.error || 'Registration failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Registration failed. Please try again.', 'error');
        console.error('Dashboard registration error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Initialize dashboard search
function initializeDashboardSearch() {
    const form = document.getElementById('dashboard-search-form');
    if (form) {
        form.addEventListener('submit', handleDashboardSearch);
    }
}

// Handle dashboard search
async function handleDashboardSearch(e) {
    e.preventDefault();
    
    const serial = document.getElementById('dash-search-serial').value.trim();
    
    if (!serial || serial.length < 3) {
        showToast('❌ Please enter a valid search term (minimum 3 characters)', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('.search-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`/api/search/serial/${encodeURIComponent(serial)}`);
        const result = await response.json();
        
        displayDashboardSearchResults(result.data, serial);
    } catch (error) {
        showToast('❌ Search failed. Please try again.', 'error');
        console.error('Dashboard search error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Display dashboard search results
function displayDashboardSearchResults(result, searchedSerial) {
    const resultsContainer = document.getElementById('dash-search-results');
    
    if (result.found && result.device) {
        const device = result.device;
        const status = result.status;
        const statusClass = status.status === 'stolen' ? 'status-lost' : 
                           status.status === 'lost' ? 'status-warning' : 'status-safe';
        const statusIcon = status.status === 'stolen' ? 'fas fa-skull-crossbones' : 
                          status.status === 'lost' ? 'fas fa-exclamation-triangle' : 'fas fa-shield-alt';
        
        // Generate identification fields display
        let identificationInfo = '';
        if (device.identificationNumbers && Object.keys(device.identificationNumbers).length > 0) {
            const deviceType = device.deviceType || 'other';
            const profile = deviceProfiles[deviceType] || deviceProfiles.other;
            
            identificationInfo = '<div class="identification-info">';
            identificationInfo += '<h4><i class="fas fa-fingerprint"></i> Identification Details</h4>';
            
            Object.entries(device.identificationNumbers).forEach(([fieldName, fieldValue]) => {
                const field = profile.identificationFields.find(f => f.name === fieldName);
                const fieldLabel = field ? field.label : fieldName.toUpperCase();
                
                identificationInfo += `<p><strong>${fieldLabel}:</strong> ${fieldValue}</p>`;
            });
            
            identificationInfo += '</div>';
        }
        
        resultsContainer.innerHTML = `
            <div class="search-result ${statusClass}">
                <div class="result-header">
                    <i class="${statusIcon}"></i>
                    <span class="status-text">${status.message}</span>
                </div>
                <div class="device-info">
                    <h3>${device.brand} ${device.model}</h3>
                    <p><strong>Device Type:</strong> ${device.deviceType}</p>
                    <p><strong>Primary Serial:</strong> ${device.serialNumber}</p>
                    ${identificationInfo}
                    <p><strong>Owner:</strong> ${device.ownerInitials || 'Protected'}</p>
                    <p><strong>Registered:</strong> ${new Date(device.registeredAt).toLocaleDateString()}</p>
                    <p><strong>Verified:</strong> ${device.verified ? '✅ Yes' : '⚠️ Pending'}</p>
                </div>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = `
            <div class="search-result status-unknown">
                <div class="result-header">
                    <i class="fas fa-question-circle"></i>
                    <span class="status-text">DEVICE NOT REGISTERED</span>
                </div>
                <p>Search Term: <strong>${searchedSerial}</strong></p>
                <p>This device identifier is not registered in our database.</p>
                <div class="action-buttons">
                    <button class="register-button" onclick="switchDashboardSection('register')">
                        <i class="fas fa-plus"></i> Register This Device
                    </button>
                    <button class="report-button" onclick="showDashboardLostReport('${searchedSerial}')">
                        <i class="fas fa-exclamation-triangle"></i> Report Lost/Stolen
                    </button>
                </div>
            </div>
        `;
    }
}

// Update dashboard device fields when device type changes
function updateDashboardDeviceFields() {
    const deviceType = document.getElementById('dash-device-type').value;
    const primarySerialLabel = document.querySelector('label[for="dash-serial-number"]');
    const primarySerialHint = document.getElementById('dash-primary-serial-hint');
    const identificationContainer = document.getElementById('dash-identification-fields-container');
    
    if (!deviceType) {
        identificationContainer.style.display = 'none';
        return;
    }
    
    const profile = deviceProfiles[deviceType] || deviceProfiles.other;
    
    // Update primary serial field label
    if (primarySerialLabel) {
        primarySerialLabel.innerHTML = `${profile.primaryId} *`;
    }
    if (primarySerialHint) {
        primarySerialHint.textContent = `Primary identifier for ${profile.name}`;
    }
    
    // Generate identification fields for dashboard
    generateDashboardIdentificationFields(profile, deviceType);
    
    // Update AI suggestions
    updateDashboardAISuggestions();
}

// Generate dashboard identification fields
function generateDashboardIdentificationFields(profile, deviceType) {
    const container = document.getElementById('dash-identification-fields-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="identification-fields-header">
            <h3><i class="${profile.icon}"></i> ${profile.name} Identification Fields</h3>
            <p>Complete these fields for comprehensive device protection</p>
        </div>
        <div class="identification-fields-grid">
            ${profile.identificationFields.map(field => `
                <div class="form-group identification-field">
                    <label for="dash-id-${field.name}">${field.label} ${field.required ? '*' : ''}</label>
                    <input 
                        type="${field.type}" 
                        id="dash-id-${field.name}" 
                        name="${field.name}" 
                        placeholder="${field.placeholder}"
                        ${field.required ? 'required' : ''}
                        ${field.pattern ? `pattern="${field.pattern}"` : ''}
                        onblur="validateDashboardIdentificationField('${field.name}', this.value, '${deviceType}')"
                    >
                    <small class="field-hint">${field.description}</small>
                    <div class="field-validation" id="dash-validation-${field.name}"></div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.style.display = 'block';
    container.classList.add('loaded');
}

// Validate dashboard identification fields
function validateDashboardIdentificationField(fieldName, value, deviceType) {
    const validationDiv = document.getElementById(`dash-validation-${fieldName}`);
    const inputElement = document.getElementById(`dash-id-${fieldName}`);
    
    if (!validationDiv || !inputElement) return;
    
    if (!value || value.trim() === '') {
        validationDiv.innerHTML = '';
        inputElement.classList.remove('valid', 'invalid');
        return;
    }
    
    // Use the existing validation function from deviceProfiles
    let validation;
    if (fieldName === 'imei' || fieldName === 'imei2') {
        validation = validateIMEI(value);
    } else if (fieldName === 'vin') {
        validation = validateVIN(value);
    } else {
        validation = { valid: true, message: 'Valid format' };
    }
    
    if (validation.valid) {
        validationDiv.innerHTML = `<span class="validation-success"><i class="fas fa-check"></i> ${validation.message}</span>`;
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
    } else {
        validationDiv.innerHTML = `<span class="validation-error"><i class="fas fa-times"></i> ${validation.message}</span>`;
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
    }
}

// Update dashboard AI suggestions
function updateDashboardAISuggestions() {
    const deviceType = document.getElementById('dash-device-type').value;
    const brand = document.getElementById('dash-brand').value;
    const model = document.getElementById('dash-model').value;
    const suggestionsPanel = document.getElementById('dash-ai-suggestions-panel');
    const suggestionsContent = document.getElementById('dash-ai-suggestions-content');
    
    if (!deviceType || !suggestionsPanel || !suggestionsContent) return;
    
    const profile = deviceProfiles[deviceType] || deviceProfiles.other;
    const suggestions = generateAISuggestions(deviceType, brand, model, profile);
    
    suggestionsContent.innerHTML = `
        <div class="ai-suggestion-item critical-field">
            <div class="suggestion-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Critical Identification Fields</h4>
            </div>
            <div class="suggestion-content">
                ${suggestions.criticalFields.map(field => `
                    <div class="field-suggestion">
                        <strong>${field.label}:</strong> ${field.reason}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="ai-suggestion-item recommendations">
            <div class="suggestion-header">
                <i class="fas fa-lightbulb"></i>
                <h4>AI Recommendations</h4>
            </div>
            <div class="suggestion-content">
                ${suggestions.recommendations.map(rec => `<p><i class="fas fa-check"></i> ${rec}</p>`).join('')}
            </div>
        </div>
        
        <div class="ai-suggestion-item security-tips">
            <div class="suggestion-header">
                <i class="fas fa-shield-alt"></i>
                <h4>Security Tips</h4>
            </div>
            <div class="suggestion-content">
                ${suggestions.securityTips.map(tip => `<p><i class="fas fa-info-circle"></i> ${tip}</p>`).join('')}
            </div>
        </div>
    `;
    
    suggestionsPanel.style.display = 'block';
}

// Trigger dashboard image upload
function triggerDashboardImageUpload() {
    const fileInput = document.getElementById('dash-device-images');
    if (fileInput) {
        fileInput.click();
    }
}

// Dashboard transfer functionality
let dashboardTransferCurrentStep = 1;
let dashboardTransferData = {};

// Initialize dashboard transfer
function initializeDashboardTransfer() {
    // Reset transfer state
    dashboardTransferCurrentStep = 1;
    dashboardTransferData = {};
    
    // Show step 1
    showDashboardTransferStep(1);
    
    // Pre-populate current owner contact
    if (currentUser) {
        const contactField = document.getElementById('dash-current-owner-contact');
        if (contactField && !contactField.value) {
            contactField.value = currentUser.email;
        }
    }
    
    // Set default transfer date to today
    const dateField = document.getElementById('dash-transfer-date');
    if (dateField && !dateField.value) {
        dateField.value = new Date().toISOString().split('T')[0];
    }
}

// Show dashboard transfer step
function showDashboardTransferStep(stepNumber) {
    // Update step indicators
    document.querySelectorAll('.transfer-step-indicator .step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= stepNumber);
    });
    
    // Hide all step contents
    document.querySelectorAll('[id^="dashboard-transfer-step-"]').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show current step
    const currentStepElement = document.getElementById(`dashboard-transfer-step-${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
    }
    
    dashboardTransferCurrentStep = stepNumber;
}

// Next dashboard transfer step
function nextDashboardTransferStep() {
    if (dashboardTransferCurrentStep === 1) {
        // Validate step 1
        const currentOwnerContact = document.getElementById('dash-current-owner-contact').value.trim();
        const serialNumber = document.getElementById('dash-transfer-device-serial').value.trim();
        const transferReason = document.getElementById('dash-transfer-reason').value;
        
        if (!currentOwnerContact || !serialNumber || !transferReason) {
            showToast('❌ Please fill in all required fields', 'error');
            return;
        }
        
        // Store step 1 data
        dashboardTransferData.currentOwnerContact = currentOwnerContact;
        dashboardTransferData.serialNumber = serialNumber.toUpperCase();
        dashboardTransferData.transferReason = transferReason;
        
        showDashboardTransferStep(2);
        
    } else if (dashboardTransferCurrentStep === 2) {
        // Validate step 2
        const newOwnerName = document.getElementById('dash-new-owner-name').value.trim();
        const newOwnerContact = document.getElementById('dash-new-owner-contact').value.trim();
        const transferDate = document.getElementById('dash-transfer-date').value;
        
        if (!newOwnerName || !newOwnerContact || !transferDate) {
            showToast('❌ Please fill in all required fields', 'error');
            return;
        }
        
        // Store step 2 data
        dashboardTransferData.newOwnerName = newOwnerName;
        dashboardTransferData.newOwnerContact = newOwnerContact;
        dashboardTransferData.newOwnerEmail = document.getElementById('dash-new-owner-email').value.trim();
        dashboardTransferData.transferDate = transferDate;
        dashboardTransferData.transferNotes = document.getElementById('dash-transfer-notes').value.trim();
        
        // Update summary
        updateDashboardTransferSummary();
        showDashboardTransferStep(3);
    }
}

// Previous dashboard transfer step
function previousDashboardTransferStep() {
    if (dashboardTransferCurrentStep > 1) {
        showDashboardTransferStep(dashboardTransferCurrentStep - 1);
    }
}

// Update dashboard transfer summary
function updateDashboardTransferSummary() {
    const summaryElements = {
        'dash-summary-serial': dashboardTransferData.serialNumber,
        'dash-summary-reason': dashboardTransferData.transferReason,
        'dash-summary-current-owner': dashboardTransferData.currentOwnerContact,
        'dash-summary-new-name': dashboardTransferData.newOwnerName,
        'dash-summary-new-contact': dashboardTransferData.newOwnerContact,
        'dash-summary-transfer-date': new Date(dashboardTransferData.transferDate).toLocaleDateString()
    };
    
    Object.entries(summaryElements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '-';
        }
    });
}

// Submit dashboard transfer
async function submitDashboardTransfer() {
    const agreementCheckbox = document.getElementById('dash-transfer-agreement');
    if (!agreementCheckbox || !agreementCheckbox.checked) {
        showToast('❌ Please agree to the transfer terms', 'error');
        return;
    }
    
    const submitButton = document.querySelector('.transfer-submit-btn');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/transfers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dashboardTransferData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Transfer completed successfully!', 'success');
            
            // Reset form
            const form = document.getElementById('dashboard-transfer-form');
            if (form) form.reset();
            
            // Go back to transfers section
            switchDashboardSection('devices');
            
        } else {
            showToast(`❌ ${result.error || 'Transfer failed'}`, 'error');
        }
    } catch (error) {
        showToast('❌ Transfer failed. Please try again.', 'error');
        console.error('Dashboard transfer error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}