// ==========================================
// COMPLAINT ROUTES
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// ==========================================
// CREATE NEW COMPLAINT
// ==========================================
router.post('/create', optionalAuth, (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            title,
            description,
            location,
            category,
            priority,
            photo,
            voice
        } = req.body;

        // Validate required fields
        if (!name || !email || !title || !description || !location || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Create complaint
        const complaint = db.createComplaint({
            name,
            email,
            phone,
            title,
            description,
            location,
            category,
            priority,
            photo: photo || null,
            voice: voice || null,
            createdBy: req.user ? req.user.id : null
        });

        res.status(201).json({
            success: true,
            message: 'Complaint created successfully',
            data: complaint
        });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating complaint',
            error: error.message
        });
    }
});

// ==========================================
// GET ALL COMPLAINTS (Officer only)
// ==========================================
router.get('/all', authMiddleware, (req, res) => {
    try {
        // Only officers can view all complaints
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const complaints = db.getAllComplaints();

        res.json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Get all complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints',
            error: error.message
        });
    }
});

// ==========================================
// GET MY COMPLAINTS (Citizen)
// ==========================================
router.get('/my-complaints', authMiddleware, (req, res) => {
    try {
        const complaints = db.getComplaintsByCitizenEmail(req.user.email);

        res.json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Get my complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints',
            error: error.message
        });
    }
});

// ==========================================
// GET COMPLAINT BY ID
// ==========================================
router.get('/:id', (req, res) => {
    try {
        const complaint = db.getComplaintById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            data: complaint
        });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaint',
            error: error.message
        });
    }
});

// ==========================================
// UPDATE COMPLAINT STATUS (Officer only)
// ==========================================
router.put('/:id/status', authMiddleware, (req, res) => {
    try {
        // Only officers can update status
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { status, note } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const complaint = db.updateComplaint(req.params.id, {
            status,
            note,
            updatedBy: req.user.id
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            data: complaint
        });
    } catch (error) {
        console.error('Update complaint status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint',
            error: error.message
        });
    }
});

// ==========================================
// ESCALATE COMPLAINT (Officer only)
// ==========================================
router.put('/:id/escalate', authMiddleware, (req, res) => {
    try {
        // Only officers can escalate
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { reason, newLevel } = req.body;

        const complaint = db.getComplaintById(req.params.id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Create escalation record
        const escalation = db.createEscalation({
            complaintId: req.params.id,
            fromLevel: complaint.level,
            toLevel: newLevel || complaint.level + 1,
            reason,
            escalatedBy: req.user.id,
            escalatedByName: req.user.name
        });

        // Update complaint
        const updatedComplaint = db.updateComplaint(req.params.id, {
            level: newLevel || complaint.level + 1,
            status: 'escalated',
            note: `Escalated to level ${newLevel || complaint.level + 1}: ${reason}`,
            updatedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Complaint escalated successfully',
            data: {
                complaint: updatedComplaint,
                escalation
            }
        });
    } catch (error) {
        console.error('Escalate complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error escalating complaint',
            error: error.message
        });
    }
});

// ==========================================
// GET ESCALATION HISTORY
// ==========================================
router.get('/:id/escalations', authMiddleware, (req, res) => {
    try {
        const escalations = db.getEscalationsByComplaintId(req.params.id);

        res.json({
            success: true,
            data: escalations
        });
    } catch (error) {
        console.error('Get escalations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching escalations',
            error: error.message
        });
    }
});

// ==========================================
// GET STATISTICS (Officer only)
// ==========================================
router.get('/statistics', authMiddleware, (req, res) => {
    try {
        // Only officers can view statistics
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const stats = db.getStatistics();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// ==========================================
// SEARCH COMPLAINTS (Officer only)
// ==========================================
router.get('/search', authMiddleware, (req, res) => {
    try {
        // Only officers can search
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { status, category, priority, search } = req.query;
        let complaints = db.getAllComplaints();

        // Filter by status
        if (status) {
            complaints = complaints.filter(c => c.status === status);
        }

        // Filter by category
        if (category) {
            complaints = complaints.filter(c => c.category === category);
        }

        // Filter by priority
        if (priority) {
            complaints = complaints.filter(c => c.priority === priority);
        }

        // Search by ID, title, or citizen name
        if (search) {
            const searchTerm = search.toLowerCase();
            complaints = complaints.filter(c =>
                c.id.toLowerCase().includes(searchTerm) ||
                c.title.toLowerCase().includes(searchTerm) ||
                c.name.toLowerCase().includes(searchTerm) ||
                c.email.toLowerCase().includes(searchTerm)
            );
        }

        res.json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Search complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching complaints',
            error: error.message
        });
    }
});

// ==========================================
// DELETE COMPLAINT (Officer only)
// ==========================================
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        // Only officers can delete
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const deleted = db.deleteComplaint(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        console.error('Delete complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting complaint',
            error: error.message
        });
    }
});

// ==========================================
// SUBMIT FEEDBACK/RATING FOR RESOLVED COMPLAINT
// ==========================================
router.post('/:id/feedback', authMiddleware, (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        // Validate rating (1-5 stars)
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5 stars'
            });
        }
        
        // Get complaint
        const complaint = db.getComplaintById(req.params.id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }
        
        // Verify this complaint belongs to current user
        if (complaint.email !== req.user.email) {
            return res.status(403).json({
                success: false,
                message: 'You can only review your own complaints'
            });
        }
        
        // Check if complaint is resolved
        if (complaint.status !== 'resolved') {
            return res.status(400).json({
                success: false,
                message: 'You can only review resolved complaints'
            });
        }
        
        // Check if feedback already submitted
        if (complaint.feedback && complaint.feedback.submittedAt) {
            return res.status(400).json({
                success: false,
                message: 'Feedback already submitted for this complaint'
            });
        }
        
        // Submit feedback
        const feedback = {
            rating: parseInt(rating),
            comment: comment || '',
            submittedAt: new Date().toISOString()
        };
        
        const updated = db.updateComplaint(req.params.id, { feedback });
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting feedback',
            error: error.message
        });
    }
});

module.exports = router;
