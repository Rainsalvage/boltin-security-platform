const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { readData, writeData } = require('../utils/database');
const emailService = require('../utils/emailService');
const { Router } = require('express');
const router = Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'boltin-super-secret-key-2025';

// Register new user
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    // Handle both username and firstName/lastName fields
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('username').optional().trim().isLength({ min: 2 }).withMessage('Username must be at least 2 characters'),
    body('phone').trim().matches(/^[\+]?[1-9][\d\s\-\(\)]{8,15}$/).withMessage('Please provide a valid phone number'),
    body('dateOfBirth').isISO8601().toDate().withMessage('Please provide a valid date of birth')
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

        const { firstName, lastName, username, email, phone, password, address, dateOfBirth } = req.body;

        // Handle both registration formats
        const userFirstName = firstName || (username ? username.split(' ')[0] : 'User');
        const userLastName = lastName || (username ? username.split(' ').slice(1).join(' ') || '' : '');
        const userPhone = phone;

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

        // Generate verification token
        const verificationToken = emailService.generateVerificationToken();
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create new user
        const newUser = {
            id: uuidv4(),
            firstName: userFirstName,
            lastName: userLastName,
            email,
            phone: userPhone,
            dateOfBirth: dateOfBirth,
            address: address || '',
            password: hashedPassword,
            avatar: null,
            isVerified: false,
            verification: {
                token: verificationToken,
                expiresAt: verificationExpiresAt.toISOString(),
                isExpired: function() {
                    return new Date() > new Date(this.expiresAt);
                }
            },
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

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            newUser.email,
            newUser.firstName,
            verificationToken
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return res.status(500).json({
                success: false,
                error: 'Registration failed. Unable to send verification email. Please try again.'
            });
        }

        // Add user to database
        users.push(newUser);
        await writeData('users', users);

        // Remove sensitive data from response
        const { password: _, verification: __, ...userResponse } = newUser;

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            data: {
                user: userResponse,
                emailSent: true,
                verificationRequired: true
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

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email address before logging in',
                requiresVerification: true,
                email: user.email
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

// Verify email address
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }

        const users = await readData('users');
        const userIndex = users.findIndex(u => 
            u.verification && 
            u.verification.token === token && 
            !u.verification.isExpired()
        );

        if (userIndex === -1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }

        // Mark user as verified
        users[userIndex].isVerified = true;
        users[userIndex].verification = null; // Clear verification data
        users[userIndex].updatedAt = new Date().toISOString();

        await writeData('users', users);

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Email verification failed. Please try again.'
        });
    }
});

// Resend verification email
router.post('/resend-verification', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { email } = req.body;
        const users = await readData('users');
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = emailService.generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.verification = {
            token: verificationToken,
            expiresAt: expiresAt.toISOString(),
            isExpired: function() {
                return new Date() > new Date(this.expiresAt);
            }
        };
        user.updatedAt = new Date().toISOString();

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            user.email,
            user.firstName,
            verificationToken
        );

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification email. Please try again later.'
            });
        }

        await writeData('users', users);

        res.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend verification email. Please try again.'
        });
    }
});

// Request password reset
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { email } = req.body;
        const users = await readData('users');
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            // Don't reveal that the user doesn't exist for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        const user = users[userIndex];

        // Generate password reset token
        const resetToken = emailService.generateVerificationToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.passwordReset = {
            token: resetToken,
            expiresAt: expiresAt.toISOString(),
            isExpired: function() {
                return new Date() > new Date(this.expiresAt);
            }
        };
        user.updatedAt = new Date().toISOString();

        // Send password reset email
        const emailResult = await emailService.sendPasswordResetEmail(
            user.email,
            user.firstName,
            resetToken
        );

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to send password reset email. Please try again later.'
            });
        }

        await writeData('users', users);

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process password reset request. Please try again.'
        });
    }
});

// Reset password with token
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg
            });
        }

        const { token, newPassword } = req.body;
        const users = await readData('users');
        const userIndex = users.findIndex(u => 
            u.passwordReset && 
            u.passwordReset.token === token && 
            !u.passwordReset.isExpired()
        );

        if (userIndex === -1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        users[userIndex].password = hashedPassword;
        users[userIndex].passwordReset = null; // Clear reset data
        users[userIndex].security.passwordChanged = new Date().toISOString();
        users[userIndex].updatedAt = new Date().toISOString();

        await writeData('users', users);

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Password reset failed. Please try again.'
        });
    }
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