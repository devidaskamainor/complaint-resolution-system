// ==========================================
// AUTHENTICATION ROUTES - MongoDB Version
// ==========================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database-mongodb');
const { authMiddleware } = require('../middleware/auth');
const { isMongoConnected } = require('../config/database');

// ==========================================
// REGISTER NEW USER
// ==========================================
router.post('/register', async (req, res) => {
    // Guard: if MongoDB is not reachable, fail fast with a clear error
    // instead of letting Mongoose buffer the query and timeout after 10 s.
    if (!isMongoConnected()) {
        console.log('⚠️  register: MongoDB unavailable, returning 503');
        return res.status(503).json({
            success: false,
            message: 'Database is temporarily unavailable. Please try again in a moment.'
        });
    }

    try {
        const { name, email, password, role, phone, department } = req.body;

        console.log('Registration attempt:', { name, email, role, phone });

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user (password hashing is done in Mongoose pre-save hook)
        const user = await db.createUser({
            name,
            email,
            password, // Will be hashed by Mongoose pre-save hook
            role,
            phone: phone || '',
            department: department || '',
            isActive: true, // All users active immediately
            isEmailVerified: true // No OTP needed
        });

        console.log('User created successfully:', user.id);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    department: user.department
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// ==========================================
// LOGIN USER
// ==========================================
router.post('/login', async (req, res) => {
    // Guard: if MongoDB is not reachable, fail fast with a clear error
    // instead of letting Mongoose buffer the query and timeout after 10 s.
    if (!isMongoConnected()) {
        console.log('⚠️  login: MongoDB unavailable, returning 503');
        return res.status(503).json({
            success: false,
            message: 'Database is temporarily unavailable. Please try again in a moment.'
        });
    }

    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password (using Mongoose model method)
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check if user is banned (for citizens)
        if (user.banStatus === 'banned') {
            if (user.banExpiry && user.banExpiry > new Date()) {
                const daysRemaining = Math.ceil((user.banExpiry - new Date()) / (1000 * 60 * 60 * 24));
                return res.status(403).json({
                    success: false,
                    message: `Your account is temporarily banned for submitting fake complaints. ${daysRemaining} days remaining.`,
                    isBanned: true,
                    banExpiry: user.banExpiry,
                    daysRemaining
                });
            } else {
                // Ban expired, auto-unban
                user.banStatus = 'active';
                user.banExpiry = undefined;
                user.banReason = undefined;
                await user.save();
            }
        }

        console.log('Login successful:', user.id);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    department: user.department
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// ==========================================
// GET CURRENT USER PROFILE
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.id);
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
                role: user.role,
                phone: user.phone,
                department: user.department,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// ==========================================
// UPDATE USER PROFILE
// ==========================================
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, department, password } = req.body;

        const updates = { name, phone, department };
        if (password) {
            updates.password = password; // Will be hashed by Mongoose
        }

        const user = await db.updateUser(req.user.id, updates);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

module.exports = router;
