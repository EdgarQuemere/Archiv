const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { uploadProject } = require('../middlewares/upload.middleware');

const projectValidation = [
  body('title').optional().trim().isLength({ max: 100 }).withMessage('Le titre ne peut pas dépasser 100 caractères.'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('La description ne peut pas dépasser 1000 caractères.'),
  body('type').optional().trim(),
  body('school').optional().trim(),
  body('year').optional().trim(),
  body('domain').optional().trim()
];

// Création d'un projet
router.post('/', requireAuth, uploadProject.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectValidation, projectController.createProject);

// Mise à jour d'un projet
router.put('/:id', requireAuth, uploadProject.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectValidation, projectController.updateProject);

// Suppression d'un projet
router.delete('/:id', requireAuth, projectController.deleteProject);

// Projets enregistrés / favoris
router.post('/:id/save', requireAuth, projectController.saveProject);
router.delete('/:id/save', requireAuth, projectController.unsaveProject);

// Liste paginée de tous les projets
router.get('/', projectController.getProjects);

// Téléchargement du PDF
router.post('/:id/download', projectController.downloadProject);

// Récupération d'un projet unique (par Slug ou par ID)
router.get('/:identifier', projectController.getProject);

module.exports = router;