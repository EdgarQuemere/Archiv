const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const requireAuth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const projectValidation = [
  body('title').optional().trim().escape(),
  body('description').optional().trim().escape(),
  body('type').optional().trim().escape(),
  body('school').optional().trim().escape(),
  body('year').optional().trim().escape(),
  body('domain').optional().trim().escape()
];

router.post('/', requireAuth, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectValidation, projectController.createProject);

router.put('/:id', requireAuth, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectValidation, projectController.updateProject);

router.delete('/:id', requireAuth, projectController.deleteProject);

// Saved projects routes
router.post('/:id/save', requireAuth, projectController.saveProject);
router.delete('/:id/save', requireAuth, projectController.unsaveProject);

router.get('/', projectController.getProjects);

router.post('/:id/download', projectController.downloadProject);

router.get('/:id', projectController.getProjectById);

module.exports = router;
