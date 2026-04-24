// ==========================================
// COMPLAINT ROUTES - MongoDB Version
// Optimized for 1 Lakh+ Users with Pagination
// ==========================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../database-mongodb');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const multer = require('multer');
const ContentAuthenticator = require('../middleware/contentAuthenticator');

// ==========================================
// CREATE NEW COMPLAINT (with file upload)
// ==========================================
router.post('/create', optionalAuth, (req, res, next) => {
    upload.array('attachments', 5)(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File size too large. Maximum size is 50MB'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        success: false,
                        message: 'Too many files. Maximum 5 files allowed'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
        }
        next();
    });
}, async (req, res) => {
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
            mediaType
        } = req.body;

        // Validate required fields
        if (!name || !email || !title || !description || !location || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Process uploaded files
        const attachments = [];
        let voiceRecording = null;
        const rejectedFiles = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                let authenticityCheck;
                
                // Determine file type and run appropriate analysis
                if (file.mimetype.startsWith('image')) {
                    // Analyze image for AI generation
                    authenticityCheck = await ContentAuthenticator.analyzeImage(file.path);
                    
                    const validation = ContentAuthenticator.validateContent(authenticityCheck, 'Image');
                    if (!validation.isValid) {
                        rejectedFiles.push({
                            filename: file.originalname,
                            reason: validation.message,
                            confidence: authenticityCheck.confidence
                        });
                        // Delete the rejected file
                        fs.unlinkSync(file.path);
                        continue;
                    }
                    
                    const attachment = {
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        url: `/uploads/complaints/${file.filename}`,
                        type: 'image',
                        mimeType: file.mimetype,
                        size: file.size,
                        authenticity: {
                            confidence: authenticityCheck.confidence,
                            warnings: authenticityCheck.warnings
                        }
                    };
                    attachments.push(attachment);
                    
                } else if (file.mimetype.startsWith('video')) {
                    // For videos, we do basic validation (full video AI detection requires more complex ML)
                    const attachment = {
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        url: `/uploads/complaints/${file.filename}`,
                        type: 'video',
                        mimeType: file.mimetype,
                        size: file.size
                    };
                    attachments.push(attachment);
                    
                } else if (file.mimetype.startsWith('audio')) {
                    // Analyze voice recording for authenticity
                    authenticityCheck = await ContentAuthenticator.analyzeVoice(file.path);
                    
                    const validation = ContentAuthenticator.validateContent(authenticityCheck, 'Voice recording');
                    if (!validation.isValid) {
                        rejectedFiles.push({
                            filename: file.originalname,
                            reason: validation.message,
                            confidence: authenticityCheck.confidence
                        });
                        // Delete the rejected file
                        fs.unlinkSync(file.path);
                        continue;
                    }
                    
                    voiceRecording = {
                        filename: file.filename,
                        originalName: file.originalname,
                        path: file.path,
                        url: `/uploads/complaints/${file.filename}`,
                        type: 'audio',
                        mimeType: file.mimetype,
                        size: file.size,
                        duration: authenticityCheck.metadata.estimatedDuration,
                        authenticity: {
                            confidence: authenticityCheck.confidence,
                            warnings: authenticityCheck.warnings
                        }
                    };
                }
            }
        }

        // If all files were rejected, return error
        if (req.files && req.files.length > 0 && attachments.length === 0 && !voiceRecording) {
            return res.status(400).json({
                success: false,
                message: 'All uploaded files were rejected as potentially fake or AI-generated',
                rejectedFiles: rejectedFiles
            });
        }

        // Determine media type
        let finalMediaType = mediaType || 'text';
        if (attachments.length > 0 && voiceRecording) {
            finalMediaType = 'multiple';
        } else if (voiceRecording) {
            finalMediaType = 'voice';
        } else if (attachments.length > 0) {
            const hasVideo = attachments.some(att => att.type === 'video');
            finalMediaType = hasVideo ? 'video' : 'photo';
        }

        // Create complaint
        const complaint = await db.createComplaint({
            name,
            email,
            phone,
            title,
            description,
            location,
            category,
            priority,
            mediaType: finalMediaType,
            attachments,
            voiceRecording,
            createdBy: req.user ? req.user.id : null
        });

        const responseData = {
            success: true,
            message: 'Complaint created successfully with verified media files',
            data: complaint
        };

        // Add warnings if any files had minor issues but were still accepted
        if (rejectedFiles.length > 0) {
            responseData.warnings = `${rejectedFiles.length} file(s) were rejected as potentially fake`;
            responseData.rejectedFiles = rejectedFiles;
        }

        res.status(201).json(responseData);
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
// GET ALL COMPLAINTS (Officer only) - WITH PAGINATION
// ==========================================
router.get('/all', authMiddleware, async (req, res) => {
    try {
        // Only officers can view all complaints
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        // Filters
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.category) filters.category = req.query.category;
        if (req.query.priority) filters.priority = req.query.priority;

        const result = await db.getAllComplaints(page, limit, filters);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
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
// GET MY COMPLAINTS (Citizen) - WITH PAGINATION
// ==========================================
router.get('/my-complaints', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        const result = await db.getComplaintsByCitizenEmail(req.user.email, page, limit);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
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
// GET OFFICER RANKINGS (Public)
// ==========================================
router.get('/officer-rankings', async (req, res) => {
    try {
        const User = require('../models/User');
        
        // Get top 10 officers by points (no email verification required)
        const topOfficers = await User.find({
            role: 'officer',
            isActive: true
        })
        .sort({ totalPoints: -1 })
        .limit(10)
        .select('name department rank totalPoints resolvedCount avgResolutionTime');

        res.json({
            success: true,
            data: topOfficers
        });
    } catch (error) {
        console.error('Get officer rankings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching officer rankings',
            error: error.message
        });
    }
});

// ==========================================
// GET PUBLIC REVIEWS (No Auth Required)
// ==========================================
router.get('/public-reviews', async (req, res) => {
    try {
        const Complaint = require('../models/Complaint');
        
        // Get all complaints with feedback/ratings
        const complaintsWithFeedback = await Complaint.find({
            'feedback.rating': { $exists: true },
            'feedback.submittedAt': { $exists: true }
        })
        .sort({ 'feedback.submittedAt': -1 })
        .limit(50)
        .select('id userName category feedback');
        
        res.json({
            success: true,
            data: complaintsWithFeedback
        });
    } catch (error) {
        console.error('Get public reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message
        });
    }
});

// ==========================================
// GET STATISTICS (Officer only)
// ==========================================
router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        // Only officers can view statistics
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const stats = await db.getStatistics();

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
// ADVANCED ANALYTICS DASHBOARD
// ==========================================
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const Complaint = require('../models/Complaint');
        
        // Get all complaints for analytics
        const allComplaints = await Complaint.find();
        
        // 1. Complaints by Category (Pie Chart)
        const categoryStats = {};
        allComplaints.forEach(c => {
            categoryStats[c.category] = (categoryStats[c.category] || 0) + 1;
        });
        
        // 2. Complaints by Status (Doughnut Chart)
        const statusStats = {
            pending: 0,
            in_progress: 0,
            approved: 0,
            resolved: 0,
            rejected: 0,
            escalated: 0
        };
        allComplaints.forEach(c => {
            if (statusStats.hasOwnProperty(c.status)) {
                statusStats[c.status]++;
            }
        });
        
        // 3. Complaints by Priority (Bar Chart)
        const priorityStats = {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
        };
        allComplaints.forEach(c => {
            if (priorityStats.hasOwnProperty(c.priority)) {
                priorityStats[c.priority]++;
            }
        });
        
        // 4. Monthly Trends (Line Chart) - Last 12 months
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthCount = allComplaints.filter(c => {
                const complaintDate = new Date(c.createdAt);
                return complaintDate >= monthStart && complaintDate <= monthEnd;
            }).length;
            
            monthlyTrends.push({
                month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
                count: monthCount
            });
        }
        
        // 5. Resolution Time Analysis
        const resolvedComplaints = allComplaints.filter(c => 
            c.status === 'resolved' && c.resolution && c.resolution.resolvedAt
        );
        
        let avgResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((sum, c) => {
                const created = new Date(c.createdAt);
                const resolved = new Date(c.resolution.resolvedAt);
                return sum + (resolved - created);
            }, 0);
            avgResolutionTime = totalTime / resolvedComplaints.length / (1000 * 60 * 60); // Convert to hours
        }
        
        // 6. Feedback/Ratings Analysis
        const ratedComplaints = allComplaints.filter(c => 
            c.feedback && c.feedback.rating
        );
        
        let avgRating = 0;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (ratedComplaints.length > 0) {
            const totalRating = ratedComplaints.reduce((sum, c) => sum + c.feedback.rating, 0);
            avgRating = totalRating / ratedComplaints.length;
            
            ratedComplaints.forEach(c => {
                ratingDistribution[c.feedback.rating]++;
            });
        }
        
        // 7. Department Performance (if department field exists)
        const departmentStats = {};
        allComplaints.forEach(c => {
            if (c.assignedDepartment) {
                departmentStats[c.assignedDepartment] = (departmentStats[c.assignedDepartment] || 0) + 1;
            }
        });
        
        // 8. Recent Activity (Last 7 days)
        const recentActivity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            
            const dayCount = allComplaints.filter(c => {
                const complaintDate = new Date(c.createdAt);
                return complaintDate >= dayStart && complaintDate < dayEnd;
            }).length;
            
            recentActivity.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                count: dayCount
            });
        }
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalComplaints: allComplaints.length,
                    resolvedComplaints: resolvedComplaints.length,
                    pendingComplaints: statusStats.pending,
                    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // hours
                    avgRating: Math.round(avgRating * 10) / 10,
                    totalRatings: ratedComplaints.length
                },
                categoryStats,
                statusStats,
                priorityStats,
                monthlyTrends,
                ratingDistribution,
                recentActivity,
                departmentStats
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
});

// ==========================================
// GET COMPLAINT BY ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const complaint = await db.getComplaintById(req.params.id);

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
router.put('/:id/status', authMiddleware, async (req, res) => {
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

        const complaint = await db.updateComplaint(req.params.id, {
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

        // Calculate officer points and update ranking
        const officer = await db.getUserById(req.user.id);
        if (officer && officer.role === 'officer') {
            let pointsEarned = 0;
            
            if (status === 'resolved') {
                pointsEarned = 10; // Base points for resolution
                
                // Bonus for fast resolution
                const resolutionTime = (new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60); // hours
                if (resolutionTime <= 24) {
                    pointsEarned += 5; // Resolved within 1 day
                } else if (resolutionTime <= 72) {
                    pointsEarned += 2; // Resolved within 3 days
                }
                
                // Update officer stats
                officer.resolvedCount = (officer.resolvedCount || 0) + 1;
                officer.totalPoints = (officer.totalPoints || 0) + pointsEarned;
                
                // Calculate average resolution time
                const currentAvg = officer.avgResolutionTime || 0;
                officer.avgResolutionTime = currentAvg === 0 ? resolutionTime : (currentAvg + resolutionTime) / 2;
                
                // Update rank based on points
                if (officer.totalPoints >= 500) officer.rank = 'diamond';
                else if (officer.totalPoints >= 301) officer.rank = 'platinum';
                else if (officer.totalPoints >= 151) officer.rank = 'gold';
                else if (officer.totalPoints >= 51) officer.rank = 'silver';
                else officer.rank = 'bronze';
                
                await officer.save();
                
                // Increment citizen's genuine complaint count
                const citizen = await db.getUserByEmail(complaint.email);
                if (citizen) {
                    citizen.genuineComplaintCount = (citizen.genuineComplaintCount || 0) + 1;
                    
                    // Unlock rewards at 10 genuine complaints
                    if (citizen.genuineComplaintCount === 10 && !citizen.rewards.includes('verified_citizen')) {
                        citizen.rewards.push({
                            type: 'verified_citizen',
                            unlockedAt: new Date(),
                            details: { badge: 'Verified Citizen', priority: 'high' }
                        });
                    }
                    
                    await citizen.save();
                }
            } else if (status === 'escalated') {
                // Deduct points for escalation
                officer.totalPoints = Math.max(0, (officer.totalPoints || 0) - 3);
                await officer.save();
            }
        }

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            data: complaint,
            pointsEarned: officer && status === 'resolved' ? officer.totalPoints : 0
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
router.put('/:id/escalate', authMiddleware, async (req, res) => {
    try {
        // Only officers can escalate
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { reason, newLevel } = req.body;

        const complaint = await db.getComplaintById(req.params.id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Create escalation record
        const escalation = await db.createEscalation({
            complaintId: req.params.id,
            fromLevel: complaint.level,
            toLevel: newLevel || complaint.level + 1,
            reason,
            escalatedBy: req.user.id,
            escalatedByEmail: req.user.email
        });

        // Update complaint
        const updatedComplaint = await db.updateComplaint(req.params.id, {
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
// GET ESCALATION HISTORY - WITH PAGINATION
// ==========================================
router.get('/:id/escalations', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const result = await db.getEscalationsByComplaintId(req.params.id, page, limit);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
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
// SEARCH COMPLAINTS (Officer only) - WITH PAGINATION
// ==========================================
router.get('/search', authMiddleware, async (req, res) => {
    try {
        // Only officers can search
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        const { status, category, priority } = req.query;
        
        // Use MongoDB filters
        const filters = {};
        if (status) filters.status = status;
        if (category) filters.category = category;
        if (priority) filters.priority = priority;

        const result = await db.getAllComplaints(page, limit, filters);

        // Note: For text search, you'd use MongoDB text indexes
        // This is a simplified version
        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
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
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Only officers can delete
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const deleted = await db.deleteComplaint(req.params.id);
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
// REJECT COMPLAINT AS FAKE (Officer only)
// ==========================================
router.put('/:id/reject-fake', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const complaint = await db.getComplaintById(req.params.id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Update complaint with timeline
        const updatedComplaint = await db.updateComplaint(req.params.id, {
            isFake: true,
            rejectedByOfficer: req.user.id,
            rejectionReason: reason,
            status: 'rejected',
            note: `Complaint rejected as fake: ${reason}`,
            updatedBy: req.user.id
        });

        // Increment user's fake complaint count
        const user = await db.getUserByEmail(complaint.email);
        if (user) {
            user.fakeComplaintCount = (user.fakeComplaintCount || 0) + 1;

            // Ban user if 3 fake complaints
            if (user.fakeComplaintCount >= 3) {
                user.banStatus = 'banned';
                user.banExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                user.banReason = 'Submitted 3 or more fake complaints';
            }

            await user.save();
        }

        // Award points to officer for detecting fake
        const officer = await db.getUserById(req.user.id);
        if (officer) {
            officer.totalPoints = (officer.totalPoints || 0) + 2;
            await officer.save();
        }

        res.json({
            success: true,
            message: 'Complaint rejected as fake',
            data: {
                complaint: updatedComplaint,
                userBanned: user && user.banStatus === 'banned'
            }
        });
    } catch (error) {
        console.error('Reject complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting complaint',
            error: error.message
        });
    }
});

// ==========================================
// SUBMIT FEEDBACK/RATING FOR RESOLVED COMPLAINT
// ==========================================
router.post('/:id/feedback', authMiddleware, async (req, res) => {
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
        const complaint = await db.getComplaintById(req.params.id);
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
            submittedAt: new Date()
        };
        
        const updatedComplaint = await db.updateComplaint(req.params.id, { feedback });
        
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
