// backend/utils/slugify.js
const prisma = require('../config/db');

// Nettoie la chaîne : minuscules, suppression des accents et caractères spéciaux
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-')     // Remplace tout sauf a-z et 0-9 par des tirets
        .replace(/^-+|-+$/g, '')         // Supprime les tirets au début et à la fin
        .slice(0, 80);                   // Limite la longueur à 80 caractères
}

// Génère un slug unique en incrémentant si déjà pris
async function generateUniqueSlug(title) {
    const baseSlug = slugify(title) || 'projet';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.project.findUnique({
            where: { slug }
        });

        if (!existing) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}

module.exports = { slugify, generateUniqueSlug };