const express = require('express');
const router = express.Router();
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, bucketName } = require('../config/s3');

router.get('/*', async (req, res) => {
    try {
        const key = req.params[0];
        if (!key) return res.status(400).json({ error: 'Fichier non spécifié' });

        // ⚠️ Autoriser explicitement l'accès multi-origine (CORS) pour que le navigateur affiche l'image
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // ⚡ Cache navigateur & proxy : 1 an pour les fichiers immuables (S3)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const response = await s3.send(command);

        if (response.ContentType) {
            res.setHeader('Content-Type', response.ContentType);
        }

        if (response.ContentLength) {
            res.setHeader('Content-Length', response.ContentLength);
        }

        if (response.ETag) {
            res.setHeader('ETag', response.ETag);
        }

        if (req.query.download) {
            const safeName = req.query.download.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const filename = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        } else {
            res.setHeader('Content-Disposition', 'inline');
        }

        response.Body.pipe(res);
    } catch (error) {
        console.error('Erreur proxy S3:', error);
        res.status(404).json({ error: 'Fichier introuvable sur le stockage.' });
    }
});

module.exports = router;
