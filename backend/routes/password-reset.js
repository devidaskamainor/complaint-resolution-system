// ==========================================
// PASSWORD RESET ROUTES
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('../database-mongodb');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../middleware/emailService');

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user
        const user = await db.getUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'If an account exists with that email, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

        // Save token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // In development mode, show token in response
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'Password reset token generated (development mode)',
                data: {
                    resetToken,
                    email: user.email,
                    expiresIn: '1 hour'
                }
            });
        }

        // In production, send email
        const emailResult = await sendPasswordResetEmail(email, user.name, resetToken);
        
        res.json({
            success: true,
            message: emailResult.success 
                ? 'Password reset link sent to your email' 
                : 'Password reset token generated (check server console)'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, reset token, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user with reset token
        const user = await db.getUserByEmail(email);
        if (!user || user.resetPasswordToken !== resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Check if token expired
        if (user.resetPasswordExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        // Update password (will be hashed by Mongoose pre-save hook)
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/validate-reset-token
 * Validate if reset token is still valid
 */
router.post('/validate-reset-token', async (req, res) => {
    try {
        const { email, resetToken } = req.body;

        if (!email || !resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Email and reset token are required'
            });
        }

        const user = await db.getUserByEmail(email);
        if (!user || user.resetPasswordToken !== resetToken) {
            return res.json({
                success: false,
                valid: false,
                message: 'Invalid reset token'
            });
        }

        if (user.resetPasswordExpires < new Date()) {
            return res.json({
                success: false,
                valid: false,
                message: 'Reset token has expired'
            });
        }

        res.json({
            success: true,
            valid: true,
            message: 'Reset token is valid'
        });

    } catch (error) {
        console.error('Validate reset token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate reset token',
            error: error.message
        });
    }
});

module.exports = router;
