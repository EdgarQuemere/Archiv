const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, bucketName } = require('../config/s3');
const path = require('path');
require('dotenv').config();

// 1. Configuration Multer S3 pour les Avatars (single)
const uploadAvatar = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'avatars/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d\'image non autorisé (JPEG, PNG, WebP uniquement).'));
    }
  }
});

// 2. Configuration Multer S3 pour les Projets (fields)
const uploadProject = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'projects/' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé (PDF, JPEG, PNG, WebP uniquement).'));
    }
  }
});

module.exports = {
  uploadAvatar,
  uploadProject
};