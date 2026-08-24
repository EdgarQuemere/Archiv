const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

// Configuration du client S3 pour MinIO
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

// Fonction pour forcer le bucket en public
const makeBucketPublic = async () => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  };

  try {
    await s3.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }));
    console.log(`Bucket ${bucketName} configuré en accès public !`);
  } catch (error) {
    if (error.name === 'NoSuchBucket') {
      console.error(`Le bucket ${bucketName} n'existe pas. Crée-le d'abord dans MinIO !`);
    } else {
      console.error('Erreur lors de la configuration de la policy du bucket:', error);
    }
  }
};

makeBucketPublic();

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 👈 5 Mo max pour les avatars
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
  limits: { fileSize: 30 * 1024 * 1024 }, // 👈 30 Mo max pour les projets / PDFs
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé (PDF, JPEG, PNG, WebP uniquement).'));
    }
  }
});

// On attache uploadAvatar à uploadProject pour garder la rétrocompatibilité
uploadProject.uploadAvatar = uploadAvatar;
uploadProject.uploadProject = uploadProject;

// Export par défaut = uploadProject (évite de casser auth.routes.js et project.routes.js)
// Mais on permet aussi la déstructuration { uploadAvatar }
module.exports = uploadProject;
module.exports.uploadAvatar = uploadAvatar;
module.exports.uploadProject = uploadProject;