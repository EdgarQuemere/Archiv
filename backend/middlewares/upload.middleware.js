const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, bucketName } = require('../config/s3');
const sharp = require('sharp');
const path = require('path');
require('dotenv').config();

// Configuration Multer en mémoire vive (memoryStorage) pour traitement Sharp
const storage = multer.memoryStorage();

// 1. Configuration Multer pour les Avatars
const uploadAvatar = multer({
  storage: storage,
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

// Middleware pour traiter l'avatar : convertir en WebP et envoyer vers S3
const processAvatar = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const key = `avatars/${uniqueSuffix}.webp`;

    // Redimensionnement éventuel et conversion en WebP optimisé
    const webpBuffer = await sharp(req.file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp'
    }));

    req.file.key = key;
    req.file.location = `/api/files/${key}`;
    req.file.mimetype = 'image/webp';
    req.file.size = webpBuffer.length;

    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'avatar en WebP:', error);
    return res.status(500).json({ error: 'Erreur lors du traitement de l\'image de profil.' });
  }
};

// 2. Configuration Multer pour les Projets (PDF + Cover)
const uploadProject = multer({
  storage: storage,
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

// Middleware pour traiter les fichiers du projet (Conversion cover en WebP + Upload S3 de pdf et cover)
const processProjectFiles = async (req, res, next) => {
  if (!req.files) return next();

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    // Traitement du PDF
    if (req.files['pdf'] && req.files['pdf'][0]) {
      const pdfFile = req.files['pdf'][0];
      const pdfKey = `projects/${uniqueSuffix}${path.extname(pdfFile.originalname) || '.pdf'}`;

      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: pdfKey,
        Body: pdfFile.buffer,
        ContentType: 'application/pdf'
      }));

      pdfFile.key = pdfKey;
      pdfFile.location = `/api/files/${pdfKey}`;
    }

    // Traitement de l'image de Cover -> Conversion WebP
    if (req.files['cover'] && req.files['cover'][0]) {
      const coverFile = req.files['cover'][0];
      const coverKey = `projects/${uniqueSuffix}.webp`;

      const webpBuffer = await sharp(coverFile.buffer)
        .webp({ quality: 85 })
        .toBuffer();

      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: coverKey,
        Body: webpBuffer,
        ContentType: 'image/webp'
      }));

      coverFile.key = coverKey;
      coverFile.location = `/api/files/${coverKey}`;
      coverFile.mimetype = 'image/webp';
      coverFile.size = webpBuffer.length;
    }

    next();
  } catch (error) {
    console.error('Erreur lors du traitement des fichiers de projet:', error);
    return res.status(500).json({ error: 'Erreur lors du traitement ou de l\'envoi des fichiers.' });
  }
};

module.exports = {
  uploadAvatar,
  processAvatar,
  uploadProject,
  processProjectFiles
};