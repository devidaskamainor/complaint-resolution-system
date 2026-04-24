// ==========================================
// SERVER - MongoDB Version (Production Ready)
// Optimized for 1 Lakh+ Users
// ==========================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

// Import routes - MongoDB versions
const complaintRoutes = require('./routes/complaints-mongodb');
const userRoutes = require('./routes/users-mongodb');
const authRoutes = require('./routes/auth-mongodb');
const otpRoutes = require('./routes/otp');
const passwordResetRoutes = require('./routes/password-reset');
const { autoEscalateComplaints } = require('./services/escalationService');
const cron = require('node-cron');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONNECT TO MONGODB
// ==========================================

let useMongoDB = true;

// Wait for MongoDB connection before starting server
const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.log('⚠️  MongoDB not available, using JSON database fallback');
        console.log('Error:', error.message);
        useMongoDB = false;
    }

    // ==========================================
    // START SERVER
    // ==========================================

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Complaint Resolution System Server      ║
║   📡 Running on: http://localhost:${PORT}       ║
║   📊 API Base: http://localhost:${PORT}/api     ║
║   🌐 Frontend: http://localhost:${PORT}         ║
║   💾 Database: ${useMongoDB ? 'MongoDB' : 'JSON (Fallback)'}               
╚═══════════════════════════════════════════════╝
        `);
        console.log('✅ Server is running and ready to accept requests!');
        console.log('\n💡 For 1 lakh users, ensure MongoDB is connected!');
    });
};

startServer();

module.exports = app;

// ==========================================
// MIDDLEWARE
// ==========================================

// Enable CORS for all routes - Allow requests from any origin (for mobile/deployment)
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==========================================
// ROUTES
// ==========================================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', passwordResetRoutes);

// Serve frontend for any non-API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

app.get('/citizen', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'citizen.html'));
});

app.get('/officer', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'officer.html'));
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==========================================
// SCHEDULED TASKS
// ==========================================

// Run auto-escalation check every hour
cron.schedule('0 * * * *', async () => {
    console.log('\n⏰ Running scheduled task: Auto-escalation check');
    await autoEscalateComplaints();
});


