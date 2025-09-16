// Mock database for Boltin App
const fs = require('fs');
const path = require('path');

// Database file paths
const DB_PATH = path.join(__dirname, '..', '..', 'database', 'db.json');

// Load database
function loadDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data) || {
            users: [],
            gadgets: [],
            notifications: [],
            chatbotConversations: [],
            adminNotifications: []
        };
    } catch (error) {
        console.error('Error loading database:', error);
        return {
            users: [],
            gadgets: [],
            notifications: [],
            chatbotConversations: [],
            adminNotifications: []
        };
    }
}

// Save to database
function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving database:', error);
        return false;
    }
}

// Get item by ID
function getById(array, id) {
    return array.find(item => item.id === id);
}

// Get by serial number
function getBySerial(array, serial) {
    return array.find(item => item.serialNumber && item.serialNumber.toLowerCase() === serial.toLowerCase());
}

// Database operations
const db = {
    // User operations
    users: {
        getAll: () => {
            const data = loadDB();
            return data.users;
        },
        getById: (id) => {
            const data = loadDB();
            return getById(data.users, id);
        },
        getByEmail: (email) => {
            const data = loadDB();
            return data.users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
        },
        getByPhone: (phone) => {
            const data = loadDB();
            return data.users.find(user => user.phone && user.phone === phone);
        },
        getByEmailOrPhone: (email, phone) => {
            const data = loadDB();
            if (email) {
                return data.users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
            } else if (phone) {
                return data.users.find(user => user.phone && user.phone === phone);
            }
            return null;
        },
        getBySocialId: (provider, providerId) => {
            const data = loadDB();
            return data.users.find(user => user.socialAuth && user.socialAuth[provider] === providerId);
        },
        create: (userData) => {
            const data = loadDB();
            const newUser = {
                id: Date.now().toString(),
                ...userData
            };
            data.users.push(newUser);
            
            if (saveDB(data)) {
                return newUser;
            }
            return null;
        },
        update: (id, updates) => {
            const data = loadDB();
            const index = data.users.findIndex(user => user.id === id);
            
            if (index !== -1) {
                data.users[index] = {
                    ...data.users[index],
                    ...updates
                };
                
                if (saveDB(data)) {
                    return data.users[index];
                }
            }
            return null;
        }
    },
    
    // Gadget operations
    gadgets: {
        getAll: () => {
            const data = loadDB();
            return data.gadgets;
        },
        getById: (id) => {
            const data = loadDB();
            return getById(data.gadgets, id);
        },
        getBySerial: (serial) => {
            const data = loadDB();
            return getBySerial(data.gadgets, serial);
        },
        create: (gadgetData) => {
            const data = loadDB();
            const newGadget = {
                id: Date.now().toString(),
                ...gadgetData
            };
            data.gadgets.push(newGadget);
            
            if (saveDB(data)) {
                return newGadget;
            }
            return null;
        },
        update: (serialNumber, updates) => {
            const data = loadDB();
            const index = data.gadgets.findIndex(gadget => 
                gadget.serialNumber && gadget.serialNumber.toLowerCase() === serialNumber.toLowerCase()
            );
            
            if (index !== -1) {
                data.gadgets[index] = {
                    ...data.gadgets[index],
                    ...updates
                };
                
                if (saveDB(data)) {
                    return data.gadgets[index];
                }
            }
            return null;
        },
        getLost: () => {
            const data = loadDB();
            return data.gadgets.filter(gadget => gadget.isLost === true);
        },
        getFlagged: () => {
            const data = loadDB();
            // In a real app, flagged gadgets might be tracked differently
            return data.gadgets.filter(gadget => gadget.isFlagged === true || gadget.isLost === true);
        }
    },
    
    // Notification operations
    notifications: {
        getAll: () => {
            const data = loadDB();
            return data.notifications;
        },
        create: (notification) => {
            const data = loadDB();
            const newNotification = {
                id: Date.now().toString(),
                ...notification
            };
            data.notifications.push(newNotification);
            
            if (saveDB(data)) {
                return newNotification;
            }
            return null;
        }
    },
    
    // Admin notification operations
    adminNotifications: {
        getAll: () => {
            const data = loadDB();
            return data.adminNotifications || [];
        },
        create: (notification) => {
            const data = loadDB();
            const newNotification = {
                id: Date.now().toString(),
                ...notification
            };
            if (!data.adminNotifications) {
                data.adminNotifications = [];
            }
            data.adminNotifications.push(newNotification);
            
            if (saveDB(data)) {
                return newNotification;
            }
            return null;
        }
    },
    
    // Chatbot conversation operations
    chatbotConversations: {
        getAll: () => {
            const data = loadDB();
            return data.chatbotConversations || [];
        },
        getBySession: (sessionId) => {
            const data = loadDB();
            return (data.chatbotConversations || []).filter(conversation => 
                conversation.sessionId === sessionId
            );
        },
        create: (conversation) => {
            const data = loadDB();
            if (!data.chatbotConversations) {
                data.chatbotConversations = [];
            }
            data.chatbotConversations.push(conversation);
            
            if (saveDB(data)) {
                return conversation;
            }
            return null;
        }
    }
};

module.exports = db;