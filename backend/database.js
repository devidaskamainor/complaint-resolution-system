// ==========================================
// DATABASE - JSON File-based Database
// ==========================================

const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'database.json');
        this.data = this.initializeDatabase();
    }

    initializeDatabase() {
        // If database file exists, read it
        if (fs.existsSync(this.dbPath)) {
            const fileData = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(fileData);
        }

        // Create new database structure
        const initialData = {
            users: [],
            complaints: [],
            escalations: [],
            metadata: {
                complaintCounter: 0,
                createdAt: new Date().toISOString()
            }
        };

        // Save initial database
        this.saveDatabase(initialData);
        return initialData;
    }

    saveDatabase(data = null) {
        const dataToSave = data || this.data;
        fs.writeFileSync(this.dbPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    }

    // ==========================================
    // USERS OPERATIONS
    // ==========================================

    createUser(userData) {
        const user = {
            id: 'U' + String(this.data.users.length + 1).padStart(4, '0'),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.data.users.push(user);
        this.saveDatabase();
        return user;
    }

    getUserByEmail(email) {
        return this.data.users.find(u => u.email === email);
    }

    getUserById(id) {
        return this.data.users.find(u => u.id === id);
    }

    getAllUsers() {
        return this.data.users;
    }

    updateUser(id, updates) {
        const userIndex = this.data.users.findIndex(u => u.id === id);
        if (userIndex === -1) return null;

        this.data.users[userIndex] = {
            ...this.data.users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveDatabase();
        return this.data.users[userIndex];
    }

    // ==========================================
    // COMPLAINTS OPERATIONS
    // ==========================================

    createComplaint(complaintData) {
        this.data.metadata.complaintCounter += 1;
        const complaintId = 'C' + String(this.data.metadata.complaintCounter).padStart(4, '0');

        const complaint = {
            id: complaintId,
            ...complaintData,
            status: 'pending',
            level: 1,
            timeline: [{
                status: 'submitted',
                timestamp: new Date().toISOString(),
                note: 'Complaint submitted by citizen'
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.data.complaints.push(complaint);
        this.saveDatabase();
        return complaint;
    }

    getAllComplaints() {
        return this.data.complaints.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    getComplaintById(id) {
        return this.data.complaints.find(c => c.id === id);
    }

    getComplaintsByCitizenEmail(email) {
        return this.data.complaints
            .filter(c => c.email === email)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    updateComplaint(id, updates) {
        const complaintIndex = this.data.complaints.findIndex(c => c.id === id);
        if (complaintIndex === -1) return null;

        // Add timeline entry for status change
        if (updates.status && updates.status !== this.data.complaints[complaintIndex].status) {
            const timelineEntry = {
                status: updates.status,
                timestamp: new Date().toISOString(),
                note: updates.note || `Status changed to ${updates.status}`,
                updatedBy: updates.updatedBy || 'system'
            };
            this.data.complaints[complaintIndex].timeline.push(timelineEntry);
        }

        this.data.complaints[complaintIndex] = {
            ...this.data.complaints[complaintIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveDatabase();
        return this.data.complaints[complaintIndex];
    }

    deleteComplaint(id) {
        const complaintIndex = this.data.complaints.findIndex(c => c.id === id);
        if (complaintIndex === -1) return false;

        this.data.complaints.splice(complaintIndex, 1);
        this.saveDatabase();
        return true;
    }

    getComplaintsByStatus(status) {
        return this.data.complaints
            .filter(c => c.status === status)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getComplaintsByCategory(category) {
        return this.data.complaints
            .filter(c => c.category === category)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // ==========================================
    // ESCALATIONS OPERATIONS
    // ==========================================

    createEscalation(escalationData) {
        const escalation = {
            id: 'E' + String(this.data.escalations.length + 1).padStart(4, '0'),
            ...escalationData,
            createdAt: new Date().toISOString()
        };

        this.data.escalations.push(escalation);
        this.saveDatabase();
        return escalation;
    }

    getEscalationsByComplaintId(complaintId) {
        return this.data.escalations
            .filter(e => e.complaintId === complaintId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // ==========================================
    // STATISTICS
    // ==========================================

    getStatistics() {
        const complaints = this.data.complaints;
        return {
            total: complaints.length,
            pending: complaints.filter(c => c.status === 'pending').length,
            in_progress: complaints.filter(c => c.status === 'in_progress').length,
            escalated: complaints.filter(c => c.status === 'escalated').length,
            approved: complaints.filter(c => c.status === 'approved').length,
            resolved: complaints.filter(c => c.status === 'resolved').length,
            rejected: complaints.filter(c => c.status === 'rejected').length,
            byCategory: this.getCategoryStats(),
            byPriority: this.getPriorityStats(),
            recentComplaints: complaints.slice(0, 10)
        };
    }

    getCategoryStats() {
        const complaints = this.data.complaints;
        const categories = {};
        complaints.forEach(c => {
            categories[c.category] = (categories[c.category] || 0) + 1;
        });
        return categories;
    }

    getPriorityStats() {
        const complaints = this.data.complaints;
        const priorities = {};
        complaints.forEach(c => {
            priorities[c.priority] = (priorities[c.priority] || 0) + 1;
        });
        return priorities;
    }
}

// Export singleton instance
module.exports = new Database();
