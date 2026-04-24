// ==========================================
// USER MODEL - MongoDB Schema
// ==========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Predefined departments list
const DEPARTMENTS = [
    'Water Supply',
    'Electricity',
    'Roads & Infrastructure',
    'Sanitation',
    'Healthcare',
    'Education',
    'Public Safety',
    'Transportation',
    'Environment',
    'Public Works',
    'Telecommunication',
    'Revenue Department'
];

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['citizen', 'officer', 'admin'],
        default: 'citizen',
        index: true
    },
    phone: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true,
        index: true
    },
    designation: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Email OTP Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String
    },
    verificationExpiry: {
        type: Date
    },
    
    // Ban System
    fakeComplaintCount: {
        type: Number,
        default: 0
    },
    banStatus: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active'
    },
    banExpiry: {
        type: Date
    },
    banReason: {
        type: String
    },
    
    // Password Reset
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    
    // Rewards System
    genuineComplaintCount: {
        type: Number,
        default: 0
    },
    rewards: [{
        type: String,
        unlockedAt: {
            type: Date,
            default: Date.now
        },
        details: mongoose.Schema.Types.Mixed
    }],
    
    // Officer Ranking System
    resolvedCount: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    rank: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    avgResolutionTime: {
        type: Number // in hours
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for fast queries
userSchema.index({ email: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function() {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return;
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for complaint count
userSchema.virtual('complaintCount', {
    ref: 'Complaint',
    localField: 'email',
    foreignField: 'email',
    count: true
});

module.exports = mongoose.model('User', userSchema);
