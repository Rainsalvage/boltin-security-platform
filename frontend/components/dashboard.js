// Dashboard Component for Boltin App
function Dashboard() {
    return `
        <div class="dashboard">
            <div class="container">
                <div class="dashboard-container">
                    <aside class="sidebar">
                        <h2>Navigation</h2>
                        <ul>
                            <li><a href="#gadget-registration" class="nav-link">Gadget Registration</a></li>
                            <li><a href="#lost-found" class="nav-link">Lost & Found</a></li>
                            <li><a href="#notifications" class="nav-link">Notifications</a></li>
                            <li><a href="#chatbot" class="nav-link">AI Chatbot</a></li>
                        </ul>
                    </aside>
                    
                    <main class="main-content">
                        <section id="gadget-registration">
                            <h2 class="section-title">Register Your Gadget</h2>
                            <div class="card">
                                <form id="gadget-form">
                                    <div class="form-group">
                                        <label for="owner-name">Owner Name:</label>
                                        <input type="text" id="owner-name" name="ownerName" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="contact">Contact:</label>
                                        <input type="text" id="contact" name="contact" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="device-type">Device Type:</label>
                                        <select id="device-type" name="deviceType" required>
                                            <option value="">Select Device Type</option>
                                            <option value="phone">Phone</option>
                                            <option value="laptop">Laptop</option>
                                            <option value="camera">Camera</option>
                                            <option value="tablet">Tablet</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="brand">Brand:</label>
                                        <input type="text" id="brand" name="brand" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="model">Model:</label>
                                        <input type="text" id="model" name="model" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="serial-number">Serial/IMEI Number:</label>
                                        <input type="text" id="serial-number" name="serialNumber" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="description">Description:</label>
                                        <textarea id="description" name="description" rows="4"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="gadget-image">Upload Image:</label>
                                        <input type="file" id="gadget-image" name="image" accept="image/*">
                                    </div>
                                    <button type="submit" class="button">Register Gadget</button>
                                </form>
                            </div>
                        </section>
                        
                        <section id="lost-found">
                            <h2 class="section-title">Lost & Found</h2>
                            <div class="card">
                                <p>If you have lost your gadget, you can report it here. If someone tries to register a gadget with the same serial/IMEI number, we will alert you.</p>
                                <button class="button secondary" onclick="reportLostGadget()">Report Lost Gadget</button>
                            </div>
                            
                            <div class="card">
                                <h3>Check Gadget Status</h3>
                                <div class="form-group">
                                    <label for="search-serial">Enter Serial/IMEI Number:</label>
                                    <input type="text" id="search-serial" name="searchSerial">
                                    <button class="button secondary" onclick="searchGadget()">Check Status</button>
                                </div>
                                <div id="search-result"></div>
                            </div>
                        </section>
                        
                        <section id="notifications">
                            <h2 class="section-title">Notifications</h2>
                            <div class="card">
                                <p>Here you will see notifications about your gadgets, including if someone has reported your lost device.</p>
                                <div id="notification-list">
                                    <p>No notifications yet.</p>
                                </div>
                            </div>
                        </section>
                        
                        <section id="chatbot">
                            <h2 class="section-title">Boltin Assistant</h2>
                            <div class="chatbot">
                                <div class="chatbot-header">
                                    <span>Boltin Assistant</span>
                                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="closeChatbot()">X</button>
                                </div>
                                <div class="chatbot-body" id="chat-messages">
                                    <div class="chat-message bot-message">Hello! I'm Boltin Assistant. How can I help you today?</div>
                                </div>
                                <div class="chatbot-footer">
                                    <form id="chat-form">
                                        <input type="text" id="chat-input" placeholder="Type your message...">
                                    </form>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    `;
}

// Function to handle gadget registration
function registerGadget(event) {
    event.preventDefault();
    
    const form = document.getElementById('gadget-form');
    const formData = new FormData(form);
    
    // In a real app, we would send this to the backend
    const gadgetData = {
        ownerName: formData.get('ownerName'),
        contact: formData.get('contact'),
        deviceType: formData.get('deviceType'),
        brand: formData.get('brand'),
        model: formData.get('model'),
        serialNumber: formData.get('serialNumber'),
        description: formData.get('description')
    };
    
    console.log('Registering gadget:', gadgetData);
    alert('Gadget registered successfully!');
    form.reset();
}

// Function to report a lost gadget
function reportLostGadget() {
    const serial = prompt('Please enter the serial/IMEI number of your lost gadget:');
    if (serial) {
        // In a real app, this would call the backend API
        console.log(`Reporting gadget with serial ${serial} as lost`);
        alert('Your gadget has been reported as lost. We will notify you if it is found.');
    }
}

// Function to search gadget by serial number
function searchGadget() {
    const serial = document.getElementById('search-serial').value;
    if (!serial) {
        alert('Please enter a serial/IMEI number');
        return;
    }
    
    // In a real app, this would call the backend API
    console.log(`Searching gadget with serial ${serial}`);
    
    // Mock response
    const resultDiv = document.getElementById('search-result');
    resultDiv.innerHTML = `
        <div class="card">
            <h3>Search Result</h3>
            <p>Status: <strong>Registered</strong></p>
            <p>Owner: John Doe</p>
            <p>Device: iPhone 13</p>
        </div>
    `;
}

// Handle chatbot form submission
document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            
            if (message) {
                // Add user message to chat
                const userMessage = document.createElement('div');
                userMessage.className = 'chat-message user-message';
                userMessage.textContent = message;
                chatMessages.appendChild(userMessage);
                
                // Clear input
                chatInput.value = '';
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Simulate bot response
                setTimeout(() => {
                    const botResponse = document.createElement('div');
                    botResponse.className = 'chat-message bot-message';
                    botResponse.textContent = 'I am the Boltin Assistant. How can I help you today?';
                    chatMessages.appendChild(botResponse);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 1000);
            }
        });
    }
});

// Close chatbot
function closeChatbot() {
    const chatbot = document.querySelector('.chatbot');
    if (chatbot) {
        chatbot.style.display = 'none';
    }
}

// Attach functions to window object so they can be accessed from HTML
window.Dashboard = Dashboard;
window.registerGadget = registerGadget;
window.reportLostGadget = reportLostGadget;
window.searchGadget = searchGadget;
window.closeChatbot = closeChatbot;

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = Dashboard();
        
        // Add event listener to the gadget form
        const gadgetForm = document.getElementById('gadget-form');
        if (gadgetForm) {
            gadgetForm.addEventListener('submit', registerGadget);
        }
    }
});