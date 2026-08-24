const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3'); // 👈 On a retiré PutBucketPolicyCommand
const path = require('path');
require('dotenv').config();

// Configuration du client S3 pour Garage / MinIO
const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'archiv-uploads';

// 1. Configuration pour les Avatars / Photos de profil (Max 5 Mo - Images uniquement)
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

// 2. Configuration pour les Projets (Max 30 Mo - PDF et Images)
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

uploadProject.uploadAvatar = uploadAvatar;
uploadProject.uploadProject = uploadProject;

module.exports = uploadProject;
module.exports.uploadAvatar = uploadAvatar;
module.exports.uploadProject = uploadProject;