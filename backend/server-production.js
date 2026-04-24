// ==========================================
// PRODUCTION SERVER - Optimized for Scale
// ==========================================

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// ==========================================
// CLUSTERING - Use All CPU Cores
// ==========================================

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 CRS Server - PRODUCTION MODE           ║
║   📊 CPU Cores: ${numCPUs}                      ║
║   🔧 Clustering: ENABLED                     ║
╚═══════════════════════════════════════════════╝
    `);
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    // Worker processes
    const app = express();
    const PORT = process.env.PORT || 3000;

    // ==========================================
    // SECURITY & PERFORMANCE MIDDLEWARE
    // ==========================================

    // Security headers
    app.use(helmet());

    // Enable compression
    app.use(compression());

    // Enable CORS
    app.use(cors());

    // Body parser with size limits
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

    // Logging
    app.use(morgan('combined'));

    // ==========================================
    // RATE LIMITING
    // ==========================================

    // General API rate limiter
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    // Strict rate limiter for auth
    const authLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // limit each IP to 20 login attempts per hour
        message: {
            success: false,
            message: 'Too many login attempts, please try again later.'
        }
    });

    // Apply rate limiters
    app.use('/api/', generalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);

    // ==========================================
    // SERVE STATIC FILES
    // ==========================================

    app.use(express.static(path.join(__dirname), {
        maxAge: '1d', // Cache static files for 1 day
        etag: true
    }));

    // ==========================================
    // ROUTES
    // ==========================================

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/complaints', complaintRoutes);

    // Serve frontend
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // ==========================================
    // ERROR HANDLING
    // ==========================================

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error(`Worker ${process.pid} - Error:`, err);
        
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Internal Server Error'
        });
    });

    // ==========================================
    // START SERVER
    // ==========================================

    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} running on port ${PORT}`);
    });
}

module.exports = app;
