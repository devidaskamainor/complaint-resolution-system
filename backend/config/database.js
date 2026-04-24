// ==========================================
// MONGODB CONNECTION CONFIGURATION
// ==========================================

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MongoDB connection string
        // For local MongoDB: mongodb://localhost:27017/complaint-resolution-system
        // For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaint-resolution-system';
        
        const conn = await mongoose.connect(mongoURI, {
            maxPoolSize: 100, // Connection pool for handling 1 lakh users
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`
╔═══════════════════════════════════════════════╗
║   🗄️  MongoDB Connected Successfully!        ║
║   📊 Host: ${conn.connection.host}
║   📁 Database: ${conn.connection.name}
║   🔗 Connection Pool: 100 connections
╚═══════════════════════════════════════════════╝
        `);

        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('\n⚠️  Falling back to JSON database...');
        console.log('💡 To use MongoDB:');
        console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
        console.log('   2. Or use MongoDB Atlas (FREE): https://www.mongodb.com/cloud/atlas');
        console.log('   3. Set MONGODB_URI in .env file\n');
        throw error;
    }
};

module.exports = connectDB;
