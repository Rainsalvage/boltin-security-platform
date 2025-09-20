const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email service configuration
class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    // Initialize email transporter
    init() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.log('Email service configuration error:', error);
                } else {
                    console.log('Email service is ready to send messages');
                }
            });
        } catch (error) {
            console.error('Failed to initialize email service:', error);
        }
    }

    // Generate verification token
    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Generate verification URL
    generateVerificationUrl(token) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        return `${baseUrl}/verify-email?token=${token}`;
    }

    // Send verification email
    async sendVerificationEmail(email, firstName, verificationToken) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const verificationUrl = this.generateVerificationUrl(verificationToken);
            
            const mailOptions = {
                from: {
                    name: 'BOLTIN Security Platform',
                    address: process.env.SMTP_USER
                },
                to: email,
                subject: 'Verify Your Email - BOLTIN Security Platform',
                html: this.getVerificationEmailTemplate(firstName, verificationUrl),
                text: `Hi ${firstName},\n\nWelcome to BOLTIN Security Platform!\n\nPlease verify your email address by clicking the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nBOLTIN Security Team`
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Failed to send verification email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(email, firstName, resetToken) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: {
                    name: 'BOLTIN Security Platform',
                    address: process.env.SMTP_USER
                },
                to: email,
                subject: 'Password Reset - BOLTIN Security Platform',
                html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
                text: `Hi ${firstName},\n\nYou requested a password reset for your BOLTIN Security Platform account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nBOLTIN Security Team`
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return { success: false, error: error.message };
        }
    }

    // Email verification template
    getVerificationEmailTemplate(firstName, verificationUrl) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
                .button:hover { transform: translateY(-2px); }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
                .security-note { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ BOLTIN Security</h1>
                    <p>Ultimate Gadget Protection Platform</p>
                </div>
                <div class="content">
                    <h2>Welcome, ${firstName}!</h2>
                    <p>Thank you for joining BOLTIN Security Platform. We're excited to help you protect your valuable devices!</p>
                    
                    <p>To complete your registration and start securing your gadgets, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </div>
                    
                    <div class="security-note">
                        <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security.
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
                    
                    <p>If you didn't create an account with BOLTIN Security, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p><strong>What's next?</strong></p>
                    <ul>
                        <li>✅ Register your devices</li>
                        <li>🔍 Get AI-powered device analysis</li>
                        <li>📱 Track and protect your gadgets</li>
                        <li>🚨 Report theft and lost devices</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>&copy; 2025 BOLTIN Security Platform. All rights reserved.</p>
                    <p>Protecting your devices, securing your future.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Password reset email template
    getPasswordResetEmailTemplate(firstName, resetUrl) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
                .button:hover { transform: translateY(-2px); }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
                .warning-note { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ BOLTIN Security</h1>
                    <p>Password Reset Request</p>
                </div>
                <div class="content">
                    <h2>Hi ${firstName},</h2>
                    <p>We received a request to reset your password for your BOLTIN Security Platform account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="warning-note">
                        <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour for your security.
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #ff6b6b;">${resetUrl}</p>
                    
                    <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p>For security reasons, we recommend:</p>
                    <ul>
                        <li>🔐 Use a strong, unique password</li>
                        <li>🔄 Don't reuse passwords from other sites</li>
                        <li>📱 Enable two-factor authentication</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>&copy; 2025 BOLTIN Security Platform. All rights reserved.</p>
                    <p>Protecting your devices, securing your future.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Test email configuration
    async testConnection() {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }
            
            await this.transporter.verify();
            return { success: true, message: 'Email service connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;