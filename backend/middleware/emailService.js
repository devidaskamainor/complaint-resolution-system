// ==========================================
// EMAIL SERVICE - Nodemailer Configuration
// ==========================================

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('⚠️  SMTP Connection Error:', error);
        console.log('📧 Email service will be unavailable until SMTP credentials are configured');
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

/**
 * Send OTP email to officer
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - Officer name
 */
async function sendOTPEmail(email, otp, name) {
    const mailOptions = {
        from: {
            name: 'Complaint Resolution System',
            address: process.env.SMTP_USER
        },
        to: email,
        subject: '🔐 Your Officer Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🏛️ Complaint Resolution System</h1>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Hello ${name},</h2>
                    <p style="color: #666; font-size: 16px;">
                        Thank you for registering as an officer in the Complaint Resolution System. 
                        To complete your registration, please use the following One-Time Password (OTP):
                    </p>
                    
                    <div style="background: white; padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <p style="color: #999; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code:</p>
                        <h1 style="color: #667eea; font-size: 48px; margin: 0; letter-spacing: 10px; font-weight: bold;">${otp}</h1>
                    </div>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; margin: 0;">
                            <strong>⚠️ Important:</strong> This OTP will expire in <strong>10 minutes</strong>. 
                            Do not share this code with anyone.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you did not request this verification, please ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This is an automated message from the Complaint Resolution System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center;">
                    <p style="color: #999; margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} Complaint Resolution System. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send escalation notification email
 * @param {string} email - Citizen email
 * @param {string} complaintId - Complaint ID
 * @param {string} complaintTitle - Complaint title
 * @param {number} fromLevel - Previous level
 * @param {number} toLevel - New level
 */
async function sendEscalationEmail(email, complaintId, complaintTitle, fromLevel, toLevel) {
    const levelNames = {
        1: 'Level 1 - Officer',
        2: 'Level 2 - Senior Officer',
        3: 'Level 3 - Department Head'
    };

    const mailOptions = {
        from: {
            name: 'Complaint Resolution System',
            address: process.env.SMTP_USER
        },
        to: email,
        subject: `⬆️ Complaint Escalated - ${complaintId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⬆️ Complaint Escalated</h1>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Dear Citizen,</h2>
                    <p style="color: #666; font-size: 16px;">
                        Your complaint has been automatically escalated to ensure timely resolution.
                    </p>
                    
                    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h3 style="color: #667eea; margin-top: 0;">Complaint Details</h3>
                        <p><strong>ID:</strong> ${complaintId}</p>
                        <p><strong>Title:</strong> ${complaintTitle}</p>
                        <p><strong>Previous Level:</strong> ${levelNames[fromLevel]}</p>
                        <p><strong>New Level:</strong> <span style="color: #f5576c; font-weight: bold;">${levelNames[toLevel]}</span></p>
                        <p><strong>Reason:</strong> 3-day timeout without resolution</p>
                    </div>
                    
                    <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
                        <p style="color: #0c5460; margin: 0;">
                            <strong>ℹ️ Note:</strong> Your complaint is now being handled by higher authority 
                            and will be prioritized for resolution.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        You can track your complaint status by logging into your citizen portal.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Escalation email sent to ${email}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Escalation email sending failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} resetToken - Password reset token
 */
async function sendPasswordResetEmail(email, name, resetToken) {
    try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Complaint Resolution System" <noreply@crs.com>',
            to: email,
            subject: 'Password Reset Request - Complaint Resolution System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                    </div>
                    <div style="padding: 30px; background: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">Hello ${name},</p>
                        <p style="font-size: 14px; color: #666;">
                            You requested a password reset for your Complaint Resolution System account.
                            Click the button below to reset your password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            Or copy and paste this link:<br>
                            <a href="${resetUrl}">${resetUrl}</a>
                        </p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999;">
                            ⏰ This link will expire in <strong>1 hour</strong>.<br>
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    <div style="background: #343a40; color: white; padding: 20px; text-align: center;">
                        <p style="margin: 0; font-size: 12px;">© 2026 Complaint Resolution System. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendOTPEmail,
    sendEscalationEmail,
    sendPasswordResetEmail
};
