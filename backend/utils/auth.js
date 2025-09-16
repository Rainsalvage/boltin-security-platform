// Authentication middleware and utilities
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'boltin_app_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    // In a real application, we would check the user's role from the database
    // For this mock implementation, we'll assume any authenticated user can be admin
    // In a real app, you would have a specific admin check
    next();
}

// Generate a token for a user
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            phone: user.phone 
        },
        process.env.JWT_SECRET || 'boltin_app_secret_key',
        { expiresIn: '24h' }
    );
}

module.exports = {
    authenticateToken,
    isAdmin,
    generateToken
};