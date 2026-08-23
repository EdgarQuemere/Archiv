const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    const now = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Pages Générales -->
  <url>
    <loc>https://artchiv.fr/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://artchiv.fr/info</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://artchiv.fr/inscription</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://artchiv.fr/connexion</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://artchiv.fr/mentions-legales</loc>
    <lastmod>${now}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Pages Projets (Générées automatiquement) -->
  ${projects
    .filter((p) => Boolean(p.slug))
    .map(
      (p) => `
  <url>
    <loc>https://artchiv.fr/projet/${p.slug}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap :', error);
    res.status(500).end();
  }
});

module.exports = router;