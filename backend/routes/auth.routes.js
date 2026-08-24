const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { uploadAvatar } = require('../middlewares/upload.middleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  message: { error: 'Trop de tentatives d\'inscription depuis cette adresse IP, veuillez réessayer dans 1 heure.' }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  message: { error: 'Trop de demandes liées aux emails depuis cette adresse IP, veuillez réessayer dans 1 heure.' }
});

router.post('/register', uploadAvatar.single('profilePicture'), [
  body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre').matches(/[^A-Za-z0-9]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  body('firstName').notEmpty().withMessage('Le prénom est requis').trim().escape(),
  body('lastName').notEmpty().withMessage('Le nom est requis').trim().escape(),
  body('pseudo').optional({ checkFalsy: true }).isLength({ min: 3, max: 30 }).withMessage('Le pseudo doit faire entre 3 et 30 caractères').matches(/^[a-zA-Z0-9_]+$/).withMessage('Le pseudo ne peut contenir que des lettres, chiffres et tirets du bas').trim().escape()
], authController.register);

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.post('/logout', authController.logout);

router.post('/google', [body('token').notEmpty()], authController.googleAuth);
router.post('/omniscient', [body('code').notEmpty()], authController.omniscientAuth);

router.post('/forgot-password', emailLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Veuillez fournir un email valide')
], authController.forgotPassword);

router.post('/reset-password/:token', emailLimiter, [
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre').matches(/[^A-Za-z0-9]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial')
], authController.resetPassword);

router.post('/verify-email/:token', emailLimiter, authController.verifyEmail);

router.post("/resend-verification", emailLimiter, [
  body("email").isEmail().normalizeEmail().withMessage("Veuillez fournir un email valide")
], authController.resendVerification);

module.exports = router;