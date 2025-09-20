const express = require('express');
const { Router } = require('express');
const router = Router();
const { asyncHandler, sendSuccess, sendError } = require('../utils/middleware');

// POST /api/chatbot/message - Handle chatbot conversation
router.post('/message', asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return sendError(res, 'Message is required', 400);
    }
    
    const userMessage = message.trim().toLowerCase();
    let botResponse = '';
    
    // Simple rule-based chatbot responses
    if (userMessage.includes('register') || userMessage.includes('registration')) {
        botResponse = `🛡️ **Device Registration Help**
        
To register your device:
1. Click "Register Device" button
2. Fill in owner details (name, contact)
3. Enter device information (type, brand, model, serial)
4. Add device description
5. Upload device images (optional)
6. Submit the form

Your device will be immediately protected! Need help with a specific step?`;
        
    } else if (userMessage.includes('search') || userMessage.includes('lookup') || userMessage.includes('find')) {
        botResponse = `🔍 **Device Search Help**
        
To search for a device:
1. Click "Search Device" button
2. Enter the device serial number or IMEI
3. Click "Search Now"

The search will show:
- ✅ Device status (safe, lost, stolen)
- 📱 Device details (if registered)
- ⚠️ Any reports against the device
- 👤 Owner information (privacy protected)

Need the serial number? Check your device settings or original packaging.`;
        
    } else if (userMessage.includes('lost') || userMessage.includes('stolen') || userMessage.includes('report')) {
        botResponse = `🚨 **Lost/Stolen Device Help**
        
To report a lost or stolen device:
1. Click "Report Lost/Stolen" button
2. Enter device serial/IMEI number
3. Provide your contact information
4. Select report type (Lost or Stolen)
5. Enter incident details (date, location, description)
6. Add police report number (if available)
7. Submit the report

Your device will be immediately flagged in our system. Recovery teams will be notified!`;
        
    } else if (userMessage.includes('transfer') || userMessage.includes('ownership')) {
        botResponse = `🔄 **Ownership Transfer Help**
        
To transfer device ownership:
1. Click "Transfer Ownership" button
2. **Step 1**: Enter current owner contact and device serial
3. **Step 2**: Enter new owner details and transfer date
4. **Step 3**: Review and confirm the transfer
5. Both parties receive transfer confirmation

The 3-step process ensures secure and legal ownership transfer.`;
        
    } else if (userMessage.includes('help') || userMessage.includes('how') || userMessage.includes('what')) {
        botResponse = `🤖 **BOLTIN Security Assistant**
        
I can help you with:
- 📝 **Device Registration** - Protect your devices
- 🔍 **Device Search** - Check device status
- 🚨 **Report Lost/Stolen** - Flag missing devices  
- 🔄 **Transfer Ownership** - Change device ownership
- 📱 **General Support** - Platform questions

What would you like help with? Just ask about any feature!`;
        
    } else if (userMessage.includes('thanks') || userMessage.includes('thank you')) {
        botResponse = `😊 You're welcome! I'm here 24/7 to help protect your devices.
        
Remember: The sooner you register your devices, the better protected they are!
        
Need anything else? Just ask!`;
        
    } else if (userMessage.includes('security') || userMessage.includes('safe') || userMessage.includes('protection')) {
        botResponse = `🛡️ **BOLTIN Security Features**
        
Your devices are protected by:
- 🔒 **Bank-level encryption** for all data
- 🌐 **Global tracking network** for recovery
- 🚨 **Instant alerts** when devices are reported
- 👮 **Law enforcement integration** for stolen devices
- 📊 **Real-time monitoring** of device status
- 🔄 **Secure ownership transfers** with legal verification

Over 50,000 users trust BOLTIN with their device security!`;
        
    } else if (userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('free')) {
        botResponse = `💰 **BOLTIN Pricing**
        
✅ **FREE Features:**
- Device registration (unlimited)
- Device search and lookup
- Lost/stolen reporting
- Basic recovery assistance
- 24/7 platform access

🎯 **Premium Features** (Coming Soon):
- Advanced tracking
- Priority recovery service
- Insurance integration
- Detailed analytics

Start protecting your devices for FREE today!`;
        
    } else {
        // Default response for unrecognized input
        botResponse = `🤖 **I'm here to help!**
        
I didn't quite understand that. Here's what I can help you with:

📝 **"help with registration"** - Device registration guide
🔍 **"how to search"** - Device lookup instructions  
🚨 **"report lost device"** - Lost/stolen reporting
🔄 **"transfer ownership"** - Ownership change process
🛡️ **"security features"** - Platform security info

Try asking about any of these topics, or type "help" for a full menu!`;
    }
    
    // Simulate a small delay for more natural conversation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    sendSuccess(res, {
        message: botResponse,
        timestamp: new Date().toISOString(),
        context: 'chatbot_response'
    });
}));

// GET /api/chatbot/help - Get chatbot help information
router.get('/help', asyncHandler(async (req, res) => {
    sendSuccess(res, {
        availableCommands: [
            'help with registration',
            'how to search',
            'report lost device', 
            'transfer ownership',
            'security features',
            'pricing information'
        ],
        examples: [
            'How do I register my phone?',
            'My device was stolen, what should I do?',
            'How do I transfer my laptop to someone else?',
            'What security features do you have?'
        ]
    });
}));

module.exports = router;