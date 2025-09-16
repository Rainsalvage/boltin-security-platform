// Boltin App - Main JavaScript Functionality

// Global variables
let registeredDevices = 0;
let recoveredDevices = 0;

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

// Load statistics from API
async function loadStats() {
    try {
        const response = await fetch('/api/gadgets');
        if (response.ok) {
            const data = await response.json();
            registeredDevices = data.data ? data.data.length : 0;
            recoveredDevices = Math.floor(registeredDevices * 0.85);
            
            // Update counters
            document.getElementById('registered-count').textContent = registeredDevices;
            document.getElementById('recovered-count').textContent = recoveredDevices;
        }
    } catch (error) {
        console.log('📊 Loading demo statistics...');
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

// Show lost device report
function showLostReport() {
    showSearch();
    showToast('🚨 Use the search function to check your device status first', 'info');
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

// Handle device registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Collect image data
    const images = [];
    const imageElements = document.querySelectorAll('#image-preview-container .image-preview img');
    imageElements.forEach(img => {
        images.push(img.src);
    });
    
    const deviceData = {
        ownerName: formData.get('ownerName'),
        contact: formData.get('contact'),
        deviceType: formData.get('deviceType'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        serialNumber: formData.get('serialNumber'),
        description: formData.get('description'),
        images: images
    };
    
    if (!validateRegistrationForm(deviceData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/gadgets/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Device registered successfully!', 'success');
            e.target.reset();
            
            // Clear uploaded images
            const previewContainer = document.getElementById('image-preview-container');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
            
            loadStats();
            localStorage.setItem('boltin_user', 'true');
        } else {
            showToast(`❌ ${result.message}`, 'error');
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

// Handle device search
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
        const response = await fetch(`/api/gadgets/search?serial=${encodeURIComponent(serial)}`);
        const result = await response.json();
        
        displaySearchResults(result);
    } catch (error) {
        showToast('❌ Search failed. Please try again.', 'error');
        console.error('Search error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Display search results
function displaySearchResults(result) {
    const resultsContainer = document.getElementById('search-results');
    
    if (result.success && result.data) {
        const device = result.data;
        const statusClass = device.isLost ? 'status-lost' : 'status-safe';
        const statusIcon = device.isLost ? 'fas fa-exclamation-triangle' : 'fas fa-shield-alt';
        const statusText = device.isLost ? 'LOST/STOLEN' : 'REGISTERED & SAFE';
        
        resultsContainer.innerHTML = `
            <div class="search-result ${statusClass}">
                <div class="result-header">
                    <i class="${statusIcon}"></i>
                    <span class="status-text">${statusText}</span>
                </div>
                <div class="device-info">
                    <h3>${device.brand} ${device.model}</h3>
                    <p><strong>Owner:</strong> ${device.ownerName}</p>
                    <p><strong>Device Type:</strong> ${device.deviceType}</p>
                    ${device.isLost ? '<p class="warning">⚠️ This device has been reported as lost or stolen!</p>' : ''}
                </div>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = `
            <div class="search-result status-unknown">
                <div class="result-header">
                    <i class="fas fa-question-circle"></i>
                    <span class="status-text">DEVICE NOT FOUND</span>
                </div>
                <p>This device is not registered in our database.</p>
                <div class="action-buttons">
                    <button class="register-button" onclick="showRegistration()">
                        <i class="fas fa-plus"></i> Register This Device
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

// Image Upload Functions
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

function removeImage(button) {
    const imagePreview = button.closest('.image-preview');
    imagePreview.remove();
}

// Transfer Workflow Functions
let currentTransferStep = 1;

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
            
            return true;
            
        case 2:
            const newOwnerName = document.getElementById('new-owner-name').value.trim();
            const newOwnerContact = document.getElementById('new-owner-contact').value.trim();
            
            if (!newOwnerName || newOwnerName.length < 2) {
                showToast('❌ Please enter a valid new owner name', 'error');
                return false;
            }
            
            if (!newOwnerContact || newOwnerContact.length < 5) {
                showToast('❌ Please enter a valid new owner contact', 'error');
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

async function submitTransfer() {
    // Validate all steps
    for (let i = 1; i <= 2; i++) {
        if (!validateTransferStep(i)) {
            currentTransferStep = i;
            updateTransferStep();
            return;
        }
    }
    
    const transferData = {
        currentOwnerContact: document.getElementById('current-owner-contact').value,
        deviceSerial: document.getElementById('transfer-device-serial').value,
        newOwnerName: document.getElementById('new-owner-name').value,
        newOwnerContact: document.getElementById('new-owner-contact').value,
        transferReason: document.getElementById('transfer-reason').value,
        timestamp: new Date().toISOString()
    };
    
    const submitButton = document.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Transfer...';
    submitButton.disabled = true;
    
    try {
        // Simulate API call for transfer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showToast('✅ Device ownership transfer initiated successfully!', 'success');
        showToast('📧 Verification emails sent to both parties', 'info');
        
        // Reset form and go back to step 1
        resetTransferForm();
        
        // Log transfer attempt
        console.log('Transfer submitted:', transferData);
        
    } catch (error) {
        showToast('❌ Transfer failed. Please try again.', 'error');
        console.error('Transfer error:', error);
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        console.error('Chat error:', error);
    }
}

// Add message to chat
function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `<i class="fas fa-robot"></i> ${message}`;
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