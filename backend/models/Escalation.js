// ==========================================
// ESCALATION MODEL - MongoDB Schema
// ==========================================

const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        sparse: true
    },
    complaintId: {
        type: String,
        required: [true, 'Complaint ID is required'],
        index: true
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true
    },
    fromLevel: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    toLevel: {
        type: Number,
        required: true,
        min: 2,
        max: 3
    },
    escalatedBy: {
        type: String,
        required: true
    },
    escalatedByEmail: {
        type: String,
        required: true,
        lowercase: true
    },
    assignedTo: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        index: true
    },
    response: {
        note: String,
        respondedAt: Date,
        respondedBy: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for fast queries
escalationSchema.index({ complaintId: 1, createdAt: -1 });
escalationSchema.index({ status: 1, createdAt: -1 });

// Auto-generate escalation ID
escalationSchema.pre('save', async function() {
    if (!this.id) {
        const count = await mongoose.model('Escalation').countDocuments();
        this.id = 'E' + String(count + 1).padStart(6, '0');
    }
});

module.exports = mongoose.model('Escalation', escalationSchema);
