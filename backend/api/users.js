// API routes for user authentication
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/auth');

// User registration
router.post('/register', (req, res) => {
    try {
        const { email, phone, password, confirmPassword, name, provider, providerId } = req.body;
        
        // Validate required fields
        if (!name || (!email && !phone) || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Check if email or phone already exists
        const existingUser = db.users.getByEmailOrPhone(email, phone);
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Validate password
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        // Create new user
        const newUser = {
            name,
            email,
            phone,
            password, // In a real app, this should be hashed
            socialAuth: provider && providerId ? { [provider]: providerId } : undefined
        };
        
        const createdUser = db.users.create(newUser);
        
        if (!createdUser) {
            return res.status(500).json({
                success: false,
                message: 'Error creating user'
            });
        }
        
        // Generate JWT token
        const token = generateToken(createdUser);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                phone: createdUser.phone
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// User login
router.post('/login', (req, res) => {
    try {
        const { email, phone, password } = req.body;
        
        // Validate required fields
        if (!email && !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/Phone and password are required'
            });
        }
        
        // Find user by email or phone
        const user = email 
            ? db.users.getByEmail(email)
            : db.users.getByPhone(phone);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // In a real app, this would be a hashed password comparison
        // For this mock implementation, we'll just check if password is provided
        if (!password || password.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }
        
        // Generate JWT token
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// Social login
router.post('/social-login', (req, res) => {
    try {
        const { provider, providerId, name, email, phone } = req.body;
        
        if (!provider || !providerId) {
            return res.status(400).json({
                success: false,
                message: 'Provider and provider ID are required for social login'
            });
        }
        
        // Check if user exists by social ID
        let user = db.users.getBySocialId(provider, providerId);
        
        // If user doesn't exist, create a new one
        if (!user) {
            // Check if user with same email or phone exists
            const existingUser = email 
                ? db.users.getByEmail(email)
                : phone ? db.users.getByPhone(phone)
                : null;
            
            if (existingUser) {
                // Link social account to existing user
                user = db.users.update(existingUser.id, {
                    socialAuth: {
                        ...existingUser.socialAuth,
                        [provider]: providerId
                    }
                });
            } else {
                // Create new user
                const newUser = {
                    name,
                    email,
                    phone,
                    socialAuth: {
                        [provider]: providerId
                    }
                };
                
                user = db.users.create(newUser);
            }
        }
        
        if (!user) {
            return res.status(500).json({
                success: false,
                message: 'Error creating user'
            });
        }
        
        // Generate JWT token
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Social login successful',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during social login',
            error: error.message
        });
    }
});

// Password reset
router.post('/reset-password', (req, res) => {
    try {
        const { email, phone, newPassword, confirmPassword } = req.body;
        
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone is required'
            });
        }
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        // Find user by email or phone
        const user = email 
            ? db.users.getByEmail(email)
            : db.users.getByPhone(phone);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update user password
        const updatedUser = db.users.update(user.id, {
            password: newPassword // In a real app, this should be a hashed password
        });
        
        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: 'Error updating password'
            });
        }
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', (req, res) => {
    try {
        const { id } = req.user;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const user = db.users.getById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

module.exports = router;