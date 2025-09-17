// Boltin App - Main JavaScript Functionality

// Global variables
let registeredDevices = 0;
let recoveredDevices = 0;
let currentTransferStep = 1;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadStats();
    setupEventListeners();
    animateCounters();
    startLiveActivityFeed();
    setupScrollIndicator();
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
    showReportForm();
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

// Show transfer section
function showTransfer() {
    hideAllSections();
    const section = document.getElementById('transfer');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Reset transfer form to step 1
    resetTransferForm();
    
    setTimeout(() => {
        document.getElementById('current-owner-contact').focus();
    }, 500);
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

// Handle device registration with backend API
async function handleRegistration(e) {
    e.preventDefault();
    
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
                'Content-Type': 'application/json'
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
            
            showToast('✅ Device registered successfully!', 'success');
            e.target.reset();
            
            // Clear uploaded images preview
            const previewContainer = document.getElementById('image-preview-container');
            if (previewContainer) {
                previewContainer.innerHTML = '';
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

// Handle device search with backend API
async function handleSearch(e) {
    e.preventDefault();
    
    const serial = document.getElementById('search-serial').value.trim();
    
    if (!serial || serial.length < 3) {
        showToast('❌ Please enter a valid serial/IMEI number', 'error');
        return;
    }
    
    const submitButton = e.target.querySelector('.search-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    submitButton.disabled = true;
    
    try {
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
function displaySearchResults(result, searchedSerial) {
    const resultsContainer = document.getElementById('search-results');
    
    if (result.found && result.device) {
        const device = result.device;
        const status = result.status;
        const statusClass = status.status === 'stolen' ? 'status-lost' : 
                           status.status === 'lost' ? 'status-warning' : 'status-safe';
        const statusIcon = status.status === 'stolen' ? 'fas fa-skull-crossbones' : 
                          status.status === 'lost' ? 'fas fa-exclamation-triangle' : 'fas fa-shield-alt';
        
        resultsContainer.innerHTML = `
            <div class="search-result ${statusClass}">
                <div class="result-header">
                    <i class="${statusIcon}"></i>
                    <span class="status-text">${status.message}</span>
                </div>
                <div class="device-info">
                    <h3>${device.brand} ${device.model}</h3>
                    <p><strong>Device Type:</strong> ${device.deviceType}</p>
                    <p><strong>Serial:</strong> ${device.serialNumber}</p>
                    <p><strong>Owner:</strong> ${device.ownerInitials || 'Protected'}</p>
                    <p><strong>Registered:</strong> ${new Date(device.registeredAt).toLocaleDateString()}</p>
                    <p><strong>Verified:</strong> ${device.verified ? '✅ Yes' : '⚠️ Pending'}</p>
                    ${status.reportDate ? `<p><strong>Report Date:</strong> ${new Date(status.reportDate).toLocaleDateString()}</p>` : ''}
                    ${status.location ? `<p><strong>Last Location:</strong> ${status.location}</p>` : ''}
                </div>
                <div class="device-actions">
                    ${status.status !== 'safe' ? 
                        '<p class="warning">⚠️ Contact local authorities if you have information about this device!</p>' : 
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
                <p>Serial: <strong>${searchedSerial}</strong></p>
                <p>This device is not registered in our database.</p>
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
            
            if (target === '#register') {
                showRegistration();
            } else if (target === '#search') {
                showSearch();
            } else if (target === '#transfer') {
                showTransfer();
            } else {
                const targetElement = document.querySelector(target);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

// Call enhanced validation setup
document.addEventListener('DOMContentLoaded', enhanceFormValidation);

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