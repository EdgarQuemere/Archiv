const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config();

// Configuration du client S3 pour MinIO
const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1', // Required by S3 SDK, can be anything for MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // IMPORTANT pour MinIO
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

// On lance la fonction au démarrage pour s'assurer que c'est public
makeBucketPublic();

// Configuration de multer pour utiliser S3 (MinIO)
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = file.fieldname === 'profilePicture' ? 'avatars/' : 'projects/';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, folder + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé.'));
    }
  }
});

module.exports = upload;
