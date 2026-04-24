// ==========================================
// MONGODB CONNECTION CONFIGURATION
// ==========================================

const mongoose = require('mongoose');

// Track connection state so routes can check it at request time
let _isConnected = false;

/**
 * Returns true only when Mongoose has an open, ready connection.
 * Routes call this before every MongoDB operation so they can fall
 * back to the JSON database instantly instead of buffering for 10 s.
 */
const isMongoConnected = () => {
    return _isConnected && mongoose.connection.readyState === 1;
};

/**
 * Attempt a single mongoose.connect() call with fast-fail timeouts.
 * serverSelectionTimeoutMS: 5 s  — give up quickly if Atlas is unreachable
 * connectTimeoutMS:         5 s  — TCP-level connect timeout
 * socketTimeoutMS:         30 s  — idle socket timeout once connected
 */
const attemptConnect = async (mongoURI) => {
    // If already connected, reuse the connection
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,  // Fail fast — 5 s
        connectTimeoutMS: 5000,          // TCP connect — 5 s
        socketTimeoutMS: 30000,          // Idle socket — 30 s
        retryWrites: true,
        w: 'majority'
    });

    return conn;
};

/**
 * Connect to MongoDB with exponential-backoff retry.
 * Tries up to `maxRetries` times before giving up and letting the
 * caller fall back to the JSON database.
 */
const connectDB = async (maxRetries = 3) => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaint-resolution-system';

    console.log('Attempting MongoDB connection...');
    console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const conn = await attemptConnect(mongoURI);

            _isConnected = true;

            // Keep _isConnected in sync with real connection events
            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected');
                _isConnected = false;
            });
            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
                _isConnected = true;
            });
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err.message);
                _isConnected = false;
            });

            console.log(`
╔═══════════════════════════════════════════════╗
║   🗄️  MongoDB Connected Successfully!        ║
║   📊 Host: ${conn.connection.host}
║   📁 Database: ${conn.connection.name}
║   🔗 Connection Pool: 10 connections
╚═══════════════════════════════════════════════╝
            `);

            return conn;
        } catch (error) {
            _isConnected = false;
            const isLastAttempt = attempt === maxRetries;

            if (isLastAttempt) {
                console.error(`❌ MongoDB connection failed after ${maxRetries} attempts: ${error.message}`);
                console.log('\n⚠️  Falling back to JSON database...');
                console.log('💡 To fix MongoDB connectivity:');
                console.log('   1. Go to MongoDB Atlas → Network Access');
                console.log('   2. Add IP: 0.0.0.0/0 (Allow from anywhere)');
                console.log('   3. Redeploy on Railway\n');
                throw error;
            }

            // Exponential backoff: 1 s, 2 s, 4 s …
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.warn(`⚠️  MongoDB attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            console.log(`   Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;
