// ==========================================
// FILE UPLOAD CONFIGURATION - Multer Setup
// ==========================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const complaintUploadsDir = path.join(uploadsDir, 'complaints');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(complaintUploadsDir)) {
    fs.mkdirSync(complaintUploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, complaintUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - allow images, videos, and audio
const fileFilter = (req, file, cb) => {
    // Allowed mime types
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|avi|mov|mkv|webm/;
    const allowedAudioTypes = /mpeg|mp3|wav|ogg|webm/;
    
    const mimetype = allowedImageTypes.test(file.mimetype) ||
                     allowedVideoTypes.test(file.mimetype) ||
                     allowedAudioTypes.test(file.mimetype);
    
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
                    allowedVideoTypes.test(path.extname(file.originalname).toLowerCase()) ||
                    allowedAudioTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpg, png, gif, webp), videos (mp4, avi, mov, mkv), and audio (mp3, wav, ogg) are allowed!'));
    }
};

// Upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 5 // Max 5 files per complaint
    },
    fileFilter: fileFilter
});

// Export upload middleware
module.exports = {
    upload,
    uploadDir: complaintUploadsDir,
    uploadsBaseUrl: '/uploads/complaints'
};
