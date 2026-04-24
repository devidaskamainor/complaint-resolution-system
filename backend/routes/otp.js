// ==========================================
// OTP ROUTES - Generation and Verification
// ==========================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sendOTPEmail } = require('../middleware/emailService');

/**
 * Generate 6-digit random OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/otp/generate
 * Generate and send OTP to officer email
 */
router.post('/generate', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10 minutes expiry

        // Save OTP to user
        user.verificationCode = otp;
        user.verificationExpiry = expiryTime;
        await user.save();

        // Send email
        const emailResult = await sendOTPEmail(email, otp, name);

        // In development mode, always succeed and show OTP in console
        if (process.env.NODE_ENV === 'development' && !emailResult.success) {
            console.log('\n🔑 DEVELOPMENT MODE - OTP:', otp);
            console.log('📧 Email not sent (SMTP not configured), but OTP is:', otp, '\n');
        }

        res.json({
            success: true,
            message: emailResult.success ? 'OTP sent successfully to your email' : 'OTP generated (check server console)',
            // In development, always show OTP
            ...(process.env.NODE_ENV === 'development' && { 
                testOTP: otp,
                devMode: true,
                devMessage: 'Check browser console (F12) for OTP'
            })
        });

    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate OTP',
            error: error.message
        });
    }
});

/**
 * POST /api/otp/verify
 * Verify OTP and activate officer account
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if OTP matches
        if (user.verificationCode !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (user.verificationExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Activate user
        user.isEmailVerified = true;
        user.verificationCode = undefined; // Clear OTP
        user.verificationExpiry = undefined; // Clear expiry
        user.isActive = true;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully! Your officer account is now active.'
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message
        });
    }
});

/**
 * POST /api/otp/resend
 * Resend OTP to email
 */
router.post('/resend', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10);

        // Save new OTP
        user.verificationCode = otp;
        user.verificationExpiry = expiryTime;
        await user.save();

        // Send email
        const emailResult = await sendOTPEmail(email, otp, name);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to resend OTP email',
                error: emailResult.error
            });
        }

        res.json({
            success: true,
            message: 'New OTP sent successfully',
            ...(process.env.NODE_ENV === 'development' && { testOTP: otp })
        });

    } catch (error) {
        console.error('OTP resend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
});

module.exports = router;
