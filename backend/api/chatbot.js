// API routes for AI Chatbot functionality
const express = require('express');
const router = express.Router();

// Chatbot interaction endpoint
router.post('/message', (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        
        // In a real application, this would send the message to an AI model API
        // For this mock implementation, we'll use simple rule-based responses
        const response = getChatbotResponse(message);
        
        // Store the conversation in the database
        const conversation = {
            sessionId: sessionId || generateSessionId(),
            timestamp: new Date().toISOString(),
            userMessage: message,
            botResponse: response
        };
        
        // Save to database
        require('../utils/db').chatbotConversations.create(conversation);
        
        res.json({
            success: true,
            data: {
                message: response,
                sessionId: conversation.sessionId,
                timestamp: conversation.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing chatbot message',
            error: error.message
        });
    }
});

// Get conversation history
router.get('/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }
        
        const history = require('../utils/db').chatbotConversations.getBySession(sessionId);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving chat history',
            error: error.message
        });
    }
});

// Simple rule-based chatbot responses
function getChatbotResponse(message) {
    // Convert message to lowercase for easier matching
    const lowerMessage = message.toLowerCase();
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm Boltin Assistant. How can I help you today?";
    }
    
    // Registration help
    if (lowerMessage.includes('register') || lowerMessage.includes('registration') || lowerMessage.includes('how to register')) {
        return "To register your gadget, you need to provide: Owner Name, Contact, Device Type, Brand, Model, Serial/IMEI number, and a description. Would you like me to guide you through the registration process?";
    }
    
    // Lost device help
    if (lowerMessage.includes('lost') || lowerMessage.includes('found') || lowerMessage.includes('how to report a lost gadget')) {
        return "If you have a lost gadget, you can report it in the Lost & Found section. I can help you through the process if you'd like.";
    }
    
    // Chatbot capabilities
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('your function') || lowerMessage.includes('what are you for')) {
        return `I can help you with: 
1. Guiding you through gadget registration
2. Helping you check if a gadget is stolen
3. Answering questions about the app
4. Providing emergency escalation steps
5. Supporting multiple languages (English, Yoruba, Hausa, Igbo). How can I assist you today?`;
    }
    
    // Multilingual support
    if (lowerMessage.includes('yoruba') || lowerMessage.includes('hausa') || lowerMessage.includes('igbo')) {
        return "Yes, I can communicate in Yoruba, Hausa, and Igbo as well as English. Just let me know which language you prefer and I'll switch for you.";
    }
    
    // Emergency steps
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('what to do if')) {
        return `If you need to report a lost gadget urgently, I recommend: 
1. Marking the gadget as lost in the app
2. Contacting local authorities
3. Informing your mobile carrier if it's a phone
4. Using the Boltin community to spread the word
Would you like me to guide you through any of these steps?`;
    }
    
    // Default response
    return "I'm here to help with gadget registration, checking if a gadget is stolen, answering app questions, and providing emergency steps. Could you please rephrase your question or be more specific about what you need help with?";
}

// Generate a session ID
function generateSessionId() {
    return `session-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

module.exports = router;