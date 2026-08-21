const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const requireAuth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/me', requireAuth, userController.getProfile);

// Permet de modifier le profil, en incluant un upload d'image optionnel (champ 'profilePicture')
router.put('/me', requireAuth, upload.single('profilePicture'), [
  body('name').optional().trim().escape(),
  body('role').optional().trim().escape(),
  body('currentSchool').optional().trim().escape(),
  body('behanceLink').optional().trim(),
  body('instaLink').optional().trim(),
  body('personalLink').optional().trim()
], userController.updateProfile);

router.delete('/me', requireAuth, userController.deleteAccount);

router.get('/me/saved-projects', requireAuth, userController.getSavedProjects);

router.put('/me/password', requireAuth, userController.updatePassword);

router.get('/:id', userController.getPublicProfile);

module.exports = router;
