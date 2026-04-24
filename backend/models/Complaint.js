// ==========================================
// COMPLAINT MODEL - MongoDB Schema
// ==========================================

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    mediaType: {
        type: String,
        enum: ['text', 'photo', 'video', 'voice', 'multiple'],
        default: 'text'
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Water Supply',
            'Electricity',
            'Road & Infrastructure',
            'Sanitation',
            'Public Safety',
            'Healthcare',
            'Education',
            'Transportation',
            'Environment',
            'Other'
        ],
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'escalated', 'approved', 'resolved', 'rejected'],
        default: 'pending',
        index: true
    },
    level: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true,
        index: true
    },
    pincode: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: String,
        trim: true,
        index: true
    },
    attachments: [{
        filename: String,
        originalName: String,
        path: String,
        url: String,
        type: {
            type: String,
            enum: ['image', 'video', 'audio', 'document']
        },
        mimeType: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    voiceRecording: {
        filename: String,
        path: String,
        url: String,
        duration: Number,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    timeline: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: {
            type: String,
            default: 'system'
        }
    }],
    resolution: {
        note: String,
        resolvedAt: Date,
        resolvedBy: String
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date
    },
    
    // Rejection & Fake Content Tracking
    rejectedByOfficer: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    isFake: {
        type: Boolean,
        default: false
    },
    
    // Escalation Tracking
    lastStatusUpdate: {
        type: Date,
        default: Date.now
    },
    escalationHistory: [{
        fromLevel: Number,
        toLevel: Number,
        reason: String,
        escalatedBy: { // 'system' for auto-escalation, officer ID for manual
            type: String,
            default: 'system'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Notifications
    notifications: [{
        type: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for optimized queries
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ email: 1, createdAt: -1 });
complaintSchema.index({ priority: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });

// Auto-generate complaint ID
complaintSchema.pre('save', async function() {
    if (!this.id) {
        const count = await mongoose.model('Complaint').countDocuments();
        this.id = 'C' + String(count + 1).padStart(6, '0');
    }
});

// Add timeline entry on status change
complaintSchema.pre('save', function() {
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`,
            updatedBy: this.modifiedBy || 'system'
        });
    }
});

// Virtual for escalation count
complaintSchema.virtual('escalationCount', {
    ref: 'Escalation',
    localField: 'id',
    foreignField: 'complaintId',
    count: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
