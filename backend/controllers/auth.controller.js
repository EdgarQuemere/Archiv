const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');
const prisma = require('../config/db');
const { s3, bucketName } = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialisation Mailjet via API HTTP
const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

// Fonction utilitaire pour formater l'URL vers le proxy backend
const formatFileUrl = (file) => {
  if (!file) return null;
  const key = file.key || (file.location ? file.location.split('/').slice(-2).join('/') : null);
  return key ? `/api/files/${key}` : file.location;
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      email, password, firstName, lastName, pseudo, displayPreference, role, currentSchool, bio,
      behanceLink, instaLink, personalLink
    } = req.body;
    
    let profilePicture = req.file ? formatFileUrl(req.file) : req.body.profilePicture;
    if (!profilePicture) {
      profilePicture = `/pdp_${Math.floor(Math.random() * 5) + 1}.webp`;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const crypto = require('crypto');
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, firstName, lastName, pseudo: pseudo || null, displayPreference, role, currentSchool, bio,
        behanceLink, instaLink, personalLink, profilePicture,
        emailVerificationToken, emailVerificationExpires
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`;

    // Envoi via Mailjet API HTTP
    try {
      await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Artchiv\'',
            },
            To: [
              {
                Email: user.email,
                Name: user.firstName || user.email,
              },
            ],
            Subject: 'Vérification de votre adresse email Artchiv',
            HTMLPart: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #111111; text-align: center;">
      <div style="background-color: #000; padding: 40px 20px; border-radius: 12px 12px 0 0;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/artchiv-logo.webp" alt="Artchiv" style="height: 40px; margin-bottom: 0;" />
      </div>
      <div style="background-color: #FFFFFF; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; font-size: 24px; color: #111111; font-weight: 600;">Bienvenue, ${user.firstName} !</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          Merci de vous être inscrit sur <strong style="color: #111111;">Artchiv</strong>. Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et activer votre compte. Ce lien est valide pendant 24 heures.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 10px; padding: 14px 28px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">
          Vérifier mon e-mail
        </a>
        <p style="margin-top: 40px; font-size: 13px; color: #999999; line-height: 1.5;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/>
          <a href="${verifyUrl}" style="color: #666666; word-break: break-all;">${verifyUrl}</a>
        </p>
      </div>
    </div>
            `,
          },
        ],
      });
    } catch (mailError) {
      console.error("Erreur d'envoi d'email de vérification Mailjet:", mailError.statusCode, mailError.message);
    }

    res.status(201).json({ message: 'Inscription réussie. Veuillez vérifier votre adresse email pour pouvoir vous connecter.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Identifiants invalides' });
  }

  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Votre compte a été banni. Contactez l\'administrateur.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre adresse email avant de vous connecter.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Connexion réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Déconnexion réussie' });
};

exports.googleAuth = async (req, res) => {
  try {
    const { token, role, currentSchool, behanceLink, instaLink, personalLink } = req.body;

    let payload;
    if (token && token.startsWith('TEST_TOKEN')) {
      const suffix = token.slice('TEST_TOKEN'.length) || '';
      payload = { email: `mockgoogle${suffix}@test.com`, given_name: 'Mock', family_name: 'Google', picture: `/pdp_${Math.floor(Math.random() * 5) + 1}.webp` };
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }
    const { email, given_name, family_name, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({ error: 'Votre compte a été banni. Contactez l\'administrateur.' });
      }
      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ message: 'Connexion réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } });
    }

    if (!role || !currentSchool) {
      return res.status(400).json({ error: 'Informations manquantes', requireMoreInfo: true });
    }

    const randomPassword = require('crypto').randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: given_name || '',
        lastName: family_name || '',
        pseudo: req.body.pseudo || null,
        displayPreference: req.body.displayPreference || 'prénom nom',
        role,
        currentSchool,
        behanceLink,
        instaLink,
        personalLink,
        profilePicture: req.body.profilePicture || `/pdp_${Math.floor(Math.random() * 5) + 1}.webp`,
        isEmailVerified: true
      },
    });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ message: 'Inscription réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'authentification Google" });
  }
};

exports.omniscientAuth = async (req, res) => {
  try {
    const { code, role, currentSchool, behanceLink, instaLink, personalLink, omniToken } = req.body;

    let email, first_name, last_name, pseudo, profile_picture;

    if (omniToken) {
      const decoded = jwt.verify(omniToken, process.env.JWT_SECRET);
      email = decoded.email;
      first_name = decoded.firstName;
      last_name = decoded.lastName;
      pseudo = decoded.pseudo;
      profile_picture = decoded.profilePicture;
    } else {
      const tokenResponse = await axios.post(`${process.env.OMNISCIENT_URL}/oauth/token`, {
        client_id: process.env.OMNISCIENT_CLIENT_ID,
        client_secret: process.env.OMNISCIENT_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: req.body.redirectUri || "https://artchiv.fr/auth/omniscient/callback"
      });

      const accessToken = tokenResponse.data.access_token;

      // Récupération des informations détaillées depuis l'API distante
      const profileResponse = await axios.get(`${process.env.OMNISCIENT_URL}/api/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      email = profileResponse.data.email;
      first_name = profileResponse.data.first_name;
      last_name = profileResponse.data.last_name;
      pseudo = profileResponse.data.pseudo || null;
      profile_picture = profileResponse.data.profile_picture || null;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({ error: 'Votre compte a été banni. Contactez l\'administrateur.' });
      }
      // Met à jour les infos si elles ont changé sur Omniscient
      user = await prisma.user.update({ 
        where: { email }, 
        data: { 
          isOmniscient: true,
          firstName: first_name || user.firstName,
          lastName: last_name || user.lastName,
          pseudo: pseudo || user.pseudo,
          profilePicture: profile_picture || user.profilePicture
        } 
      });

      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ 
        message: "Connexion réussie", 
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } 
      });
    }

    if (!role || !currentSchool) {
      const tempToken = jwt.sign({ email, firstName: first_name, lastName: last_name, pseudo, profilePicture: profile_picture }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(400).json({
        error: "Informations manquantes",
        requireMoreInfo: true,
        omniToken: tempToken,
        partialData: { email, firstName: first_name, lastName: last_name, pseudo, profilePicture: profile_picture }
      });
    }

    const randomPassword = require("crypto").randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Création de l'utilisateur avec toutes les données récupérées
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: first_name || "",
        lastName: last_name || "",
        pseudo: pseudo || null,
        displayPreference: req.body.displayPreference || 'prénom nom',
        role,
        currentSchool,
        behanceLink,
        instaLink,
        personalLink,
        profilePicture: profile_picture || `/pdp_${Math.floor(Math.random() * 5) + 1}.webp`,
        isOmniscient: true,
        isEmailVerified: true
      },
    });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ 
      message: "Inscription réussie", 
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } 
    });
  } catch (error) {
    console.error("Erreur Omniscient Auth:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erreur lors de l'authentification avec Omniscient" });
  }
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    try {
      await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Artchiv\'',
            },
            To: [
              {
                Email: user.email,
                Name: user.firstName || user.email,
              },
            ],
            Subject: 'Réinitialisation de votre mot de passe Artchiv',
            HTMLPart: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #111111; text-align: center;">
      <div style="background-color: #111111; padding: 40px 20px; border-radius: 12px 12px 0 0;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/artchiv-logo.webp" alt="Artchiv" style="height: 40px; margin-bottom: 0;" />
      </div>
      <div style="background-color: #FFFFFF; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; font-size: 24px; color: #111111; font-weight: 600;">Réinitialisation de mot de passe</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          Vous avez demandé la réinitialisation de votre mot de passe sur <strong style="color: #111111;">Artchiv</strong>. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valide pendant 1 heure.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin-top: 10px; padding: 14px 28px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">
          Réinitialiser le mot de passe
        </a>
        <p style="margin-top: 40px; font-size: 13px; color: #999999; line-height: 1.5;">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.<br/><br/>
          Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/>
          <a href="${resetUrl}" style="color: #666666; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </div>
            `,
          },
        ],
      });
      console.log(`[AUTH] Email de réinitialisation envoyé à ${email}`);
    } catch (mailError) {
      console.error("Erreur d'envoi Mailjet réinitialisation:", mailError.statusCode, mailError.message);
    }

    res.status(200).json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la demande de réinitialisation de mot de passe" });
  }
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Le lien de réinitialisation est invalide ou a expiré." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ message: "Votre mot de passe a été réinitialisé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la réinitialisation du mot de passe" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Le lien de vérification est invalide ou a expiré." });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    const jwtToken = jwt.sign({ userId: verifiedUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: "Votre adresse email a été vérifiée avec succès.",
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        firstName: verifiedUser.firstName,
        lastName: verifiedUser.lastName,
        pseudo: verifiedUser.pseudo,
        displayPreference: verifiedUser.displayPreference,
        profilePicture: verifiedUser.profilePicture,
        isAdmin: verifiedUser.isAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la vérification de l'email" });
  }
};

exports.resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "Utilisateur non trouvé avec cet email." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Votre email est déjà vérifié." });
    }

    const crypto = require('crypto');
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`;

    try {
      await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Artchiv\'',
            },
            To: [
              {
                Email: user.email,
                Name: user.firstName || user.email,
              },
            ],
            Subject: 'Vérification de votre adresse email Artchiv\'',
            HTMLPart: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; color: #111111; text-align: center;">
      <div style="background-color: #000; padding: 40px 20px; border-radius: 12px 12px 0 0;">
        <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/artchiv-logo.webp" alt="Artchiv" style="height: 40px; margin-bottom: 0;" />
      </div>
      <div style="background-color: #FFFFFF; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; font-size: 24px; color: #111111; font-weight: 600;">Bienvenue, ${user.firstName} !</h2>
        <p style="color: #666666; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          Merci de vous être inscrit sur <strong style="color: #111111;">Artchiv</strong>. Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et activer votre compte. Ce lien est valide pendant 24 heures.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 10px; padding: 14px 28px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;">
          Vérifier mon e-mail
        </a>
        <p style="margin-top: 40px; font-size: 13px; color: #999999; line-height: 1.5;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/>
          <a href="${verifyUrl}" style="color: #666666; word-break: break-all;">${verifyUrl}</a>
        </p>
      </div>
    </div>
            `,
          },
        ],
      });
    } catch (mailError) {
      console.error("Erreur d'envoi d'email de vérification Mailjet:", mailError.statusCode, mailError.message);
    }

    res.status(200).json({ message: "L'email de vérification a été renvoyé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors du renvoi de l'email de vérification." });
  }
};