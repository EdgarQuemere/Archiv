const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const requireAuth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/', requireAuth, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectController.createProject);

router.put('/:id', requireAuth, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), projectController.updateProject);

router.delete('/:id', requireAuth, projectController.deleteProject);

router.get('/', projectController.getProjects);

router.get('/:id', projectController.getProjectById);

module.exports = router;
