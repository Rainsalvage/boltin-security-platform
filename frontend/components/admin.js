// Admin Panel Component for Boltin App
function AdminDashboard() {
    return `
        <div class="dashboard">
            <div class="container">
                <div class="dashboard-container">
                    <aside class="sidebar">
                        <h2>Admin Menu</h2>
                        <ul>
                            <li><a href="#gadget-management" class="nav-link">Gadget Management</a></li>
                            <li><a href="#user-management" class="nav-link">User Management</a></li>
                            <li><a href="#lost-devices" class="nav-link">Lost Devices</a></li>
                            <li><a href="#chatbot-logs" class="nav-link">Chatbot Logs</a></li>
                            <li><a href="#analytics" class="nav-link">Analytics</a></li>
                        </ul>
                    </aside>
                    
                    <main class="main-content">
                        <section id="gadget-management">
                            <h2 class="section-title">Gadget Management</h2>
                            <div class="card">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Owner</th>
                                                <th>Device</th>
                                                <th>Serial Number</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="gadget-list">
                                            <!-- Gadget rows will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        
                        <section id="user-management">
                            <h2 class="section-title">User Management</h2>
                            <div class="card">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Registration Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="user-list">
                                            <!-- User rows will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        
                        <section id="lost-devices">
                            <h2 class="section-title">Lost Devices</h2>
                            <div class="card">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Owner</th>
                                                <th>Device</th>
                                                <th>Serial Number</th>
                                                <th>Reported Lost</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="lost-list">
                                            <!-- Lost device rows will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        
                        <section id="chatbot-logs">
                            <h2 class="section-title">Chatbot Conversation Logs</h2>
                            <div class="card">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Message</th>
                                                <th>Response</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody id="chatbot-list">
                                            <!-- Chatbot rows will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        
                        <section id="analytics">
                            <h2 class="section-title">Analytics</h2>
                            <div class="card">
                                <div class="analytics-overview">
                                    <div class="analytics-card">
                                        <h3>Total Gadgets</h3>
                                        <p id="total-gadgets">0</p>
                                    </div>
                                    <div class="analytics-card">
                                        <h3>Total Users</h3>
                                        <p id="total-users">0</p>
                                    </div>
                                    <div class="analytics-card">
                                        <h3>Lost Gadgets</h3>
                                        <p id="total-lost">0</p>
                                    </div>
                                    <div class="analytics-card">
                                        <h3>Flagged Gadgets</h3>
                                        <p id="total-flagged">0</p>
                                    </div>
                                    <div class="analytics-card">
                                        <h3>Chatbot Usage</h3>
                                        <p id="total-chatbot">0</p>
                                    </div>
                                </div>
                                
                                <div class="analytics-section">
                                    <h3>Sentiment Analysis</h3>
                                    <div class="analytics-chart">
                                        <div class="chart-bar">
                                            <div class="bar-label">Positive</div>
                                            <div class="bar-container">
                                                <div class="bar positive" style="width: 45%"></div>
                                            </div>
                                            <div class="bar-percentage">45%</div>
                                        </div>
                                        <div class="chart-bar">
                                            <div class="bar-label">Neutral</div>
                                            <div class="bar-container">
                                                <div class="bar neutral" style="width: 35%"></div>
                                            </div>
                                            <div class="bar-percentage">35%</div>
                                        </div>
                                        <div class="chart-bar">
                                            <div class="bar-label">Negative</div>
                                            <div class="bar-container">
                                                <div class="bar negative" style="width: 20%"></div>
                                            </div>
                                            <div class="bar-percentage">20%</div>
                                        </div>
                                    </div>
                                    <p class="chart-description">Sentiment analysis of chatbot conversations to identify common user concerns and satisfaction levels.</p>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    `;
}

// Function to load gadget management data
function loadGadgets() {
    // In a real app, this would fetch data from the backend
    // For demo purposes, we'll use mock data
    const gadgetList = document.getElementById('gadget-list');
    
    if (gadgetList) {
        const mockGadgets = [
            { owner: 'John Doe', device: 'iPhone 13', serial: '123456789012345', status: 'Registered' },
            { owner: 'Jane Smith', device: 'Samsung Galaxy S23', serial: '543210987654321', status: 'Lost' },
            { owner: 'Michael Johnson', device: 'Dell XPS 15', serial: '987654321098765', status: 'Registered' },
            { owner: 'Sarah Williams', device: 'Sony A7 IV', serial: '321098765432109', status: 'Flagged' }
        ];
        
        gadgetList.innerHTML = '';
        
        mockGadgets.forEach(gadget => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${gadget.owner}</td>
                <td>${gadget.device}</td>
                <td>${gadget.serial}</td>
                <td>${gadget.status}</td>
                <td>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="viewGadgetDetails('${gadget.serial}')">View</button>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="updateGadgetStatus('${gadget.serial}')">Update</button>
                </td>
            `;
            
            gadgetList.appendChild(row);
        });
    }
}

// Function to load user management data
function loadUsers() {
    // In a real app, this would fetch data from the backend
    // For demo purposes, we'll use mock data
    const userList = document.getElementById('user-list');
    
    if (userList) {
        const mockUsers = [
            { name: 'John Doe', email: 'john@example.com', phone: '+234 801 234 5678', registered: '2024-03-15' },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '+234 802 345 6789', registered: '2024-03-16' },
            { name: 'Michael Johnson', email: 'michael@example.com', phone: '+234 803 456 7890', registered: '2024-03-17' },
            { name: 'Sarah Williams', email: 'sarah@example.com', phone: '+234 804 567 8901', registered: '2024-03-18' }
        ];
        
        userList.innerHTML = '';
        
        mockUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.registered}</td>
                <td>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="viewUserDetails('${user.email}')">View</button>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="suspendUser('${user.email}')">Suspend</button>
                </td>
            `;
            
            userList.appendChild(row);
        });
    }
}

// Function to load lost devices
function loadLostDevices() {
    // In a real app, this would fetch data from the backend
    // For demo purposes, we'll use mock data
    const lostList = document.getElementById('lost-list');
    
    if (lostList) {
        const mockLost = [
            { owner: 'John Doe', device: 'iPhone 13', serial: '543210987654321', reported: '2024-03-20' },
            { owner: 'Sarah Williams', device: 'Sony A7 IV', serial: '321098765432109', reported: '2024-03-21' }
        ];
        
        lostList.innerHTML = '';
        
        mockLost.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${device.owner}</td>
                <td>${device.device}</td>
                <td>${device.serial}</td>
                <td>${device.reported}</td>
                <td>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="viewLostDetails('${device.serial}')">View</button>
                    <button class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" onclick="markAsFound('${device.serial}')">Mark as Found</button>
                </td>
            `;
            
            lostList.appendChild(row);
        });
    }
}

// Function to load chatbot logs
function loadChatbotLogs() {
    // In a real app, this would fetch data from the backend
    // For demo purposes, we'll use mock data
    const chatbotList = document.getElementById('chatbot-list');
    
    if (chatbotList) {
        const mockChats = [
            { user: 'John Doe', message: 'How do I register a gadget?', response: 'To register a gadget, you need to provide: Owner Name, Contact, Device Type, Brand, Model, Serial/IMEI number, and a description.', date: '2024-03-22 10:30:00' },
            { user: 'Jane Smith', message: 'What should I do if my phone is stolen?', response: 'If your phone is stolen, you should: 1. Report it as lost in the app 2. Contact your mobile carrier 3. File a police report 4. Use the Boltin community to spread the word', date: '2024-03-22 10:35:00' },
            { user: 'Michael Johnson', message: 'Can I register a gadget without a serial number?', response: 'While you can register a gadget without a serial number, we strongly recommend providing it as it helps in identifying lost gadgets.', date: '2024-03-22 10:40:00' }
        ];
        
        chatbotList.innerHTML = '';
        
        mockChats.forEach(chat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${chat.user}</td>
                <td>${chat.message}</td>
                <td>${chat.response}</td>
                <td>${chat.date}</td>
            `;
            
            chatbotList.appendChild(row);
        });
    }
}

// Function to load analytics data
function loadAnalytics() {
    // In a real app, this would fetch data from the backend
    // For demo purposes, we'll use mock data
    const totalGadgets = document.getElementById('total-gadgets');
    const totalUsers = document.getElementById('total-users');
    const totalLost = document.getElementById('total-lost');
    const totalFlagged = document.getElementById('total-flagged');
    const totalChatbot = document.getElementById('total-chatbot');
    
    if (totalGadgets) totalGadgets.textContent = '1,234';
    if (totalUsers) totalUsers.textContent = '892';
    if (totalLost) totalLost.textContent = '156';
    if (totalFlagged) totalFlagged.textContent = '28';
    if (totalChatbot) totalChatbot.textContent = '2,450';
}

// View gadget details
function viewGadgetDetails(serial) {
    // In a real app, this would fetch gadget details from the backend
    alert(`View details for gadget with serial ${serial}`);
}

// Update gadget status
function updateGadgetStatus(serial) {
    // In a real app, this would call the backend API to update the gadget status
    alert(`Update status for gadget with serial ${serial}`);
}

// View user details
function viewUserDetails(email) {
    // In a real app, this would fetch user details from the backend
    alert(`View details for user ${email}`);
}

// Suspend user
function suspendUser(email) {
    // In a real app, this would call the backend API to suspend a user
    if (confirm(`Are you sure you want to suspend user ${email}?`)) {
        alert(`User ${email} has been suspended.`);
    }
}

// View lost device details
function viewLostDetails(serial) {
    // In a real app, this would fetch lost device details from the backend
    alert(`View details for lost device with serial ${serial}`);
}

// Mark device as found
function markAsFound(serial) {
    // In a real app, this would call the backend API to mark a device as found
    if (confirm(`Are you sure you want to mark device with serial ${serial} as found?`)) {
        alert(`Device with serial ${serial} has been marked as found.`);
        // In a real app, we would fetch the owner details and notify them
        alert(`Owner has been notified that their device has been found.`);
    }
}

// Load the admin dashboard
function loadAdminDashboard() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = AdminDashboard();
        
        // Load all admin components
        loadGadgets();
        loadUsers();
        loadLostDevices();
        loadChatbotLogs();
        loadAnalytics();
    }
}

// Attach functions to window object so they can be accessed from HTML
window.AdminDashboard = AdminDashboard;
window.loadAdminDashboard = loadAdminDashboard;
window.loadGadgets = loadGadgets;
window.loadUsers = loadUsers;
window.loadLostDevices = loadLostDevices;
window.loadChatbotLogs = loadChatbotLogs;
window.loadAnalytics = loadAnalytics;
window.viewGadgetDetails = viewGadgetDetails;
window.updateGadgetStatus = updateGadgetStatus;
window.viewUserDetails = viewUserDetails;
window.suspendUser = suspendUser;
window.viewLostDetails = viewLostDetails;
window.markAsFound = markAsFound;

// Initialize the admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#admin') {
        loadAdminDashboard();
    }
});