const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

router.post('/register', [
  body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('firstName').notEmpty().withMessage('Le prénom est requis').trim().escape(),
  body('lastName').notEmpty().withMessage('Le nom est requis').trim().escape()
], authController.register);

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.post('/logout', authController.logout);

router.post('/google', [ body('token').notEmpty() ], authController.googleAuth);
router.post('/omniscient', [ body('code').notEmpty() ], authController.omniscientAuth);

module.exports = router;
