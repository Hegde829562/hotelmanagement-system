// =====================================================================
// INTELLISTAY: Multer File Upload Middleware
// =====================================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../frontend/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed: JPG, JPEG, PNG, WEBP.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: config.uploadMaxSize },
  fileFilter
});

module.exports = upload;

