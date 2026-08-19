const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const requireAuth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/me', requireAuth, userController.getProfile);

// Permet de modifier le profil, en incluant un upload d'image optionnel (champ 'profilePicture')
router.put('/me', requireAuth, upload.single('profilePicture'), userController.updateProfile);

module.exports = router;
