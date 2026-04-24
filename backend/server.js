// ==========================================
// SERVER - Main Entry Point
// ==========================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

// Import routes
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// Enable CORS for all routes
app.use(cors());

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));

// ==========================================
// ROUTES
// ==========================================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);

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
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Complaint Resolution System Server      ║
║   📡 Running on: http://localhost:${PORT}       ║
║   📊 API Base: http://localhost:${PORT}/api     ║
║   🌐 Frontend: http://localhost:${PORT}         ║
╚═══════════════════════════════════════════════╝
    `);
    console.log('✅ Server is running and ready to accept requests!');
});

module.exports = app;
