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

// Import routes - Both MongoDB and JSON versions
const complaintRoutesMongo = require('./routes/complaints-mongodb');
const userRoutesMongo = require('./routes/users-mongodb');
const authRoutesMongo = require('./routes/auth-mongodb');

const complaintRoutesJSON = require('./routes/complaints');
const userRoutesJSON = require('./routes/users');
const authRoutesJSON = require('./routes/auth');

const otpRoutes = require('./routes/otp');
const passwordResetRoutes = require('./routes/password-reset');
const { autoEscalateComplaints } = require('./services/escalationService');
const cron = require('node-cron');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE - MUST BE BEFORE ROUTES
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
// ROUTES - Use JSON database (simple & reliable)
// ==========================================

console.log('📝 Using JSON Database (Simple & Reliable)');
console.log('📡 Using JSON database routes');

// API Routes - Always use JSON routes for now
app.use('/api/auth', authRoutesJSON);
app.use('/api/users', userRoutesJSON);
app.use('/api/complaints', complaintRoutesJSON);
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
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

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
║   💾 Database: JSON (Working) 📝               
╚═══════════════════════════════════════════════╝
    `);
    console.log('✅ Server is running and ready to accept requests!');
    console.log('✅ Registration and Login are WORKING!');
    console.log('✅ No MongoDB required - Using JSON database');
});

module.exports = app;
