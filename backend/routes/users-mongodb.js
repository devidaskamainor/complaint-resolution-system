// ==========================================
// USER ROUTES - MongoDB Version
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('../database-mongodb');
const { authMiddleware } = require('../middleware/auth');

// ==========================================
// GET ALL USERS (Admin/Officer only) - WITH PAGINATION
// ==========================================
router.get('/all', authMiddleware, async (req, res) => {
    try {
        // Only officers can view all users
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        const result = await db.getAllUsers(page, limit);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// ==========================================
// GET USER BY ID
// ==========================================
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.params.id);
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
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// ==========================================
// UPDATE USER (Officer only)
// ==========================================
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // Only officers can update users
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { name, phone, department, isActive } = req.body;
        const updates = {};

        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (department) updates.department = department;
        if (isActive !== undefined) updates.isActive = isActive;

        const user = await db.updateUser(req.params.id, updates);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                department: user.department,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

module.exports = router;
