const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { uploadProject, processProjectFiles } = require('../middlewares/upload.middleware');

const projectValidation = [
  body('title').optional().customSanitizer(val => typeof val === 'string' ? val.replace(/\r\n/g, '\n').trim() : val).escape().isLength({ max: 100 }).withMessage('Le titre ne peut pas dépasser 100 caractères.'),
  body('description').optional().customSanitizer(val => typeof val === 'string' ? val.replace(/\r\n/g, '\n').trim() : val).escape().isLength({ max: 1000 }).withMessage('La description ne peut pas dépasser 1000 caractères.'),
  body('type').optional().trim().escape(),
  body('school').optional().trim().escape(),
  body('year').optional().trim().escape(),
  body('domain').optional().trim().escape()
];

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Trop de téléchargements depuis cette IP, veuillez réessayer plus tard.' }
});

const saveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes de favoris depuis cette IP, veuillez réessayer plus tard.' }
});

// Création d'un projet
router.post('/', requireAuth, uploadProject.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), processProjectFiles, projectValidation, projectController.createProject);

// Mise à jour d'un projet
router.put('/:id', requireAuth, uploadProject.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), processProjectFiles, projectValidation, projectController.updateProject);

// Suppression d'un projet
router.delete('/:id', requireAuth, projectController.deleteProject);

// Projets enregistrés / favoris
router.post('/:id/save', requireAuth, saveLimiter, projectController.saveProject);
router.delete('/:id/save', requireAuth, saveLimiter, projectController.unsaveProject);

// Liste paginée de tous les projets
router.get('/', projectController.getProjects);

// Téléchargement du PDF
router.post('/:id/download', downloadLimiter, projectController.downloadProject);

// Récupération d'un projet unique (par Slug ou par ID)
router.get('/:identifier', projectController.getProject);

module.exports = router;