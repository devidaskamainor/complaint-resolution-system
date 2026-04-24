// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const jwt = require('jsonwebtoken');
const db = require('../database-mongodb');

// ==========================================
// VERIFY JWT TOKEN (Required Authentication)
// ==========================================
async function authMiddleware(req, res, next) {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Access denied.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Check if user exists
        const user = await db.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Access denied.'
        });
    }
}

// ==========================================
// OPTIONAL AUTHENTICATION
// (Continues even if no token is provided)
// ==========================================
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await db.getUserById(decoded.id);
            
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                };
            }
        }
        
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
}

// ==========================================
// ROLE-BASED AUTHORIZATION
// ==========================================
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
}

module.exports = {
    authMiddleware,
    optionalAuth,
    requireRole
};
