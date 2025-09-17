const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { readData, writeData } = require('../utils/database');
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'boltin-super-secret-key-2025';

// Register new user
router.post('/register', [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, phone, password, address } = req.body;

        // Read existing users
        const users = await readData('users');

        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = {
            id: uuidv4(),
            firstName,
            lastName,
            email,
            phone,
            address: address || '',
            password: hashedPassword,
            avatar: null,
            isVerified: false,
            role: 'user',
            preferences: {
                notifications: true,
                newsletter: false,
                twoFA: false
            },
            stats: {
                devicesRegistered: 0,
                reportsCreated: 0,
                transfersCompleted: 0
            },
            security: {
                lastLogin: null,
                loginHistory: [],
                passwordChanged: new Date().toISOString(),
                failedAttempts: 0,
                isLocked: false
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add user to database
        users.push(newUser);
        await writeData('users', users);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                email: newUser.email,
                role: newUser.role 
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Remove password from response
        const { password: _, ...userResponse } = newUser;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { email, password, rememberMe } = req.body;

        // Read users
        const users = await readData('users');
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (user.security.isLocked) {
            return res.status(423).json({
                success: false,
                error: 'Account is temporarily locked due to multiple failed attempts'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment failed attempts
            user.security.failedAttempts += 1;
            if (user.security.failedAttempts >= 5) {
                user.security.isLocked = true;
                setTimeout(async () => {
                    // Unlock account after 15 minutes
                    const updatedUsers = await readData('users');
                    const userToUnlock = updatedUsers.find(u => u.id === user.id);
                    if (userToUnlock) {
                        userToUnlock.security.isLocked = false;
                        userToUnlock.security.failedAttempts = 0;
                        await writeData('users', updatedUsers);
                    }
                }, 15 * 60 * 1000); // 15 minutes
            }
            
            await writeData('users', users);
            
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Reset failed attempts on successful login
        user.security.failedAttempts = 0;
        user.security.isLocked = false;
        user.security.lastLogin = new Date().toISOString();
        
        // Add to login history
        user.security.loginHistory.unshift({
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'Unknown'
        });
        
        // Keep only last 10 login records
        user.security.loginHistory = user.security.loginHistory.slice(0, 10);
        
        user.updatedAt = new Date().toISOString();
        await writeData('users', users);

        // Generate JWT token
        const tokenExpiry = rememberMe ? '30d' : '24h';
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const users = await readData('users');
        const user = users.find(u => u.id === req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('address').optional().trim()
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { firstName, lastName, phone, address } = req.body;
        const users = await readData('users');
        const userIndex = users.findIndex(u => u.id === req.user.userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update user data
        const user = users[userIndex];
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        user.updatedAt = new Date().toISOString();

        users[userIndex] = user;
        await writeData('users', users);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Profile update failed'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirmNewPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('New passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { currentPassword, newPassword } = req.body;
        const users = await readData('users');
        const userIndex = users.findIndex(u => u.id === req.user.userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedNewPassword;
        user.security.passwordChanged = new Date().toISOString();
        user.updatedAt = new Date().toISOString();

        users[userIndex] = user;
        await writeData('users', users);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Password change failed'
        });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const users = await readData('users');
        const devices = await readData('devices');
        const reports = await readData('reports');
        const transfers = await readData('transfers');

        const user = users.find(u => u.id === req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Calculate user-specific statistics
        const userDevices = devices.filter(d => d.ownerId === req.user.userId);
        const userReports = reports.filter(r => r.reporterId === req.user.userId);
        const userTransfers = transfers.filter(t => 
            t.currentOwnerId === req.user.userId || t.newOwnerId === req.user.userId
        );

        const stats = {
            devicesRegistered: userDevices.length,
            reportsCreated: userReports.length,
            transfersCompleted: userTransfers.filter(t => t.status === 'completed').length,
            safeDevices: userDevices.filter(d => d.status === 'safe').length,
            lostDevices: userDevices.filter(d => d.status === 'lost').length,
            stolenDevices: userDevices.filter(d => d.status === 'stolen').length,
            joinDate: user.createdAt,
            lastLogin: user.security.lastLogin
        };

        // Update user stats in database
        user.stats = {
            devicesRegistered: stats.devicesRegistered,
            reportsCreated: stats.reportsCreated,
            transfersCompleted: stats.transfersCompleted
        };
        await writeData('users', users);

        res.json({
            success: true,
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

// Logout (invalidate token on client side)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token is required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
}

// Export middleware for use in other routes
module.exports = router;
module.exports.authenticateToken = authenticateToken;