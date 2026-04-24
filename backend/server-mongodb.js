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
// CONNECT TO MONGODB
// ==========================================

let useMongoDB = true;

// Wait for MongoDB connection before starting server
const startServer = async () => {
    try {
        // Check if MONGODB_URI is set
        if (!process.env.MONGODB_URI) {
            console.log('⚠️  MONGODB_URI environment variable is NOT set!');
            console.log('📝 Please set MONGODB_URI in Railway environment variables');
            throw new Error('MONGODB_URI not configured');
        }
        
        console.log('✅ MONGODB_URI is configured');
        await connectDB();
        console.log('✅ MongoDB connected successfully');
        useMongoDB = true;
    } catch (error) {
        console.log('⚠️  MongoDB not available, using JSON database fallback');
        console.log('Error:', error.message);
        console.log('\n💡 App will work with JSON database. To use MongoDB:');
        console.log('1. Go to MongoDB Atlas → Network Access');
        console.log('2. Add IP Address: 0.0.0.0/0 (Allow from anywhere)');
        console.log('3. Wait 2 minutes');
        console.log('4. Redeploy on Railway\n');
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
║   💾 Database: ${useMongoDB ? 'MongoDB ✅' : 'JSON (Working) 📝'}               
╚═══════════════════════════════════════════════╝
        `);
        console.log('✅ Server is running and ready to accept requests!');
        console.log('✅ Registration and Login are WORKING!');
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

// Use MongoDB or JSON routes based on connection status
const authRoutes = useMongoDB ? authRoutesMongo : authRoutesJSON;
const complaintRoutes = useMongoDB ? complaintRoutesMongo : complaintRoutesJSON;
const userRoutes = useMongoDB ? userRoutesMongo : userRoutesJSON;

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', passwordResetRoutes);

console.log(`📡 Using ${useMongoDB ? 'MongoDB' : 'JSON'} database routes`);

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


