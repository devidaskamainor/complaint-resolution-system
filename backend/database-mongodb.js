// ==========================================
// DATABASE - MongoDB Implementation
// Optimized for 1 Lakh+ Users
// ==========================================

const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Escalation = require('./models/Escalation');

class MongoDB {
    
    // ==========================================
    // USERS OPERATIONS
    // ==========================================

    async createUser(userData) {
        try {
            const userCount = await User.countDocuments();
            const user = await User.create({
                id: 'U' + String(userCount + 1).padStart(6, '0'),
                ...userData
            });
            return user;
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmail(email) {
        return await User.findOne({ email }).select('+password');
    }

    async getUserById(id) {
        return await User.findOne({ id });
    }

    async getAllUsers(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const users = await User.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-password');
        
        const total = await User.countDocuments();
        
        return {
            data: users,
            pagination: {
                current: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async updateUser(id, updates) {
        return await User.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true, runValidators: true }
        );
    }

    async deleteUser(id) {
        return await User.findOneAndDelete({ id });
    }

    // ==========================================
    // COMPLAINTS OPERATIONS
    // ==========================================

    async createComplaint(complaintData) {
        const complaint = await Complaint.create({
            ...complaintData,
            timeline: [{
                status: 'submitted',
                timestamp: new Date(),
                note: 'Complaint submitted by citizen'
            }]
        });
        return complaint;
    }

    async getAllComplaints(page = 1, limit = 50, filters = {}) {
        const skip = (page - 1) * limit;
        let query = {};

        // Apply filters
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        if (filters.priority) query.priority = filters.priority;
        if (filters.email) query.email = filters.email;
        if (filters.assignedTo) query.assignedTo = filters.assignedTo;

        const complaints = await Complaint.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Complaint.countDocuments(query);
        
        return {
            data: complaints,
            pagination: {
                current: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getComplaintById(id) {
        return await Complaint.findOne({ id });
    }

    async getComplaintsByCitizenEmail(email, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const complaints = await Complaint.find({ email })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Complaint.countDocuments({ email });
        
        return {
            data: complaints,
            pagination: {
                current: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async updateComplaint(id, updates) {
        // Add timeline entry if status changes
        if (updates.status) {
            const timelineEntry = {
                status: updates.status,
                timestamp: new Date(),
                note: updates.note || `Status changed to ${updates.status}`,
                updatedBy: updates.updatedBy || 'system'
            };
            
            // Use $push for timeline array
            return await Complaint.findOneAndUpdate(
                { id },
                {
                    $set: updates,
                    $push: { timeline: timelineEntry }
                },
                { new: true, runValidators: true }
            );
        }

        return await Complaint.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true, runValidators: true }
        );
    }

    async deleteComplaint(id) {
        return await Complaint.findOneAndDelete({ id });
    }

    async getComplaintsByStatus(status, page = 1, limit = 50) {
        return await this.getAllComplaints(page, limit, { status });
    }

    async getComplaintsByCategory(category, page = 1, limit = 50) {
        return await this.getAllComplaints(page, limit, { category });
    }

    // ==========================================
    // ESCALATIONS OPERATIONS
    // ==========================================

    async createEscalation(escalationData) {
        const escalation = await Escalation.create(escalationData);
        return escalation;
    }

    async getEscalationsByComplaintId(complaintId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const escalations = await Escalation.find({ complaintId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Escalation.countDocuments({ complaintId });
        
        return {
            data: escalations,
            pagination: {
                current: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // ==========================================
    // STATISTICS
    // ==========================================

    async getStatistics() {
        const total = await Complaint.countDocuments();
        const pending = await Complaint.countDocuments({ status: 'pending' });
        const inProgress = await Complaint.countDocuments({ status: 'in_progress' });
        const escalated = await Complaint.countDocuments({ status: 'escalated' });
        const approved = await Complaint.countDocuments({ status: 'approved' });
        const resolved = await Complaint.countDocuments({ status: 'resolved' });
        const rejected = await Complaint.countDocuments({ status: 'rejected' });

        // Category stats using aggregation
        const categoryStats = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Priority stats using aggregation
        const priorityStats = await Complaint.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Recent complaints
        const recentComplaints = await Complaint.find()
            .sort({ createdAt: -1 })
            .limit(10);

        return {
            total,
            pending,
            in_progress: inProgress,
            escalated,
            approved,
            resolved,
            rejected,
            byCategory: categoryStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byPriority: priorityStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            recentComplaints
        };
    }

    async getCategoryStats() {
        const stats = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        return stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
    }

    async getPriorityStats() {
        const stats = await Complaint.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        
        return stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
    }
}

// Export singleton instance
module.exports = new MongoDB();
