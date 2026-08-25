import express from 'express';
import { isbot } from 'isbot';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || 'https://api.artchiv.fr/api';

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// Function to decode HTML entities (simple version)
function decodeHTMLEntities(text) {
  if (!text) return '';
  return text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
}

app.get(/(.*)/, async (req, res) => {
  const userAgent = req.get('user-agent');
  let indexPath = path.join(__dirname, 'dist', 'index.html');
  
  // Si le build n'est pas encore généré (ex: en dev), on fallback sur le fichier source si besoin
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(__dirname, 'index.html');
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Si c'est un bot et qu'il visite un projet
  if (isbot(userAgent) && req.path.startsWith('/projet/')) {
    try {
      const slug = req.path.split('/')[2];
      const response = await axios.get(`${API_URL}/projects/${slug}`);
      const project = response.data.project;

      if (project) {
        const authorName = project.author ? `${project.author.firstName} ${project.author.lastName}` : 'Un étudiant';
        const type = project.type || 'Projet';
        const school = project.school || '';
        const year = project.year || '';
        
        const dynamicTitle = `${decodeHTMLEntities(project.title)} - ${authorName}`;
        const dynamicDescription = `${type} par ${authorName} (${school}, ${year})`;
        const dynamicImage = project.coverUrl || 'https://artchiv.fr/archiv_logo_condesed.webp';
        
        // Remplacement dynamique des balises
        html = html.replace(/<title>.*?<\/title>/, `<title>${dynamicTitle}</title>`);
        html = html.replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${dynamicDescription}" />`);
        
        html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${dynamicTitle}" />`);
        html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${dynamicDescription}" />`);
        html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${dynamicImage}" />`);

        html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${dynamicTitle}" />`);
        html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${dynamicDescription}" />`);
        html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${dynamicImage}" />`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du projet pour le bot:', error.message);
    }
  }

  // Pour la page /info ou autres, on pourrait ajouter d'autres conditions si nécessaire
  // mais les projets sont les plus importants pour l'OpenGraph

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Serveur SSR Proxy démarré sur le port ${PORT}`);
});
