const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');
const prisma = require('../config/db');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      email, password, firstName, lastName, pseudo, displayPreference, role, currentSchool, 
      behanceLink, instaLink, personalLink
    } = req.body;
    let profilePicture = req.file ? req.file.location : req.body.profilePicture;
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
        email, password: hashedPassword, firstName, lastName, pseudo: pseudo || null, displayPreference, role, currentSchool,
        behanceLink, instaLink, personalLink, profilePicture,
        emailVerificationToken, emailVerificationExpires
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${emailVerificationToken}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Artchiv" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Vérification de votre adresse email Artchiv',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #EEEEEE; color: #111111; text-align: center; border-radius: 8px;">
      <div style="background-color: #111111; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #EEEEEE; margin: 0; font-size: 24px; letter-spacing: 1px;">ARCHIV</h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #111111;">Bienvenue, ${user.firstName} !</h2>
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          Merci de vous être inscrit sur Archiv ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et activer votre compte. Ce lien est valide pendant 24 heures.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #111111; color: #EEEEEE; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
          Vérifier mon e-mail
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #999999;">
          Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/>
          <a href="${verifyUrl}" style="color: #111111;">${verifyUrl}</a>
        </p>
      </div>
    </div>
  `
    };

    transporter.sendMail(mailOptions).catch(err => console.error("Erreur d'envoi d'email de vérification:", err));

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
    
    // MOCK VERIFICATION
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
      if (!user.isOmniscient) {
        user = await prisma.user.update({ where: { email }, data: { isOmniscient: true } });
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
        profilePicture: picture || `/pdp_${Math.floor(Math.random() * 5) + 1}.webp`,
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
    
    let email, first_name, last_name;

    if (omniToken) {
      // Decode the temporary token
      const decoded = jwt.verify(omniToken, process.env.JWT_SECRET);
      email = decoded.email;
      first_name = decoded.firstName;
      last_name = decoded.lastName;
    } else {
      const tokenResponse = await axios.post(`${process.env.OMNISCIENT_URL}/oauth/token`, {
        client_id: process.env.OMNISCIENT_CLIENT_ID,
        client_secret: process.env.OMNISCIENT_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: req.body.redirectUri || "http://localhost:3006/auth/omniscient/callback"
      });
      
      const accessToken = tokenResponse.data.access_token;
      
      const profileResponse = await axios.get(`${process.env.OMNISCIENT_URL}/api/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      email = profileResponse.data.email;
      first_name = profileResponse.data.first_name;
      last_name = profileResponse.data.last_name;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({ error: 'Votre compte a été banni. Contactez l\'administrateur.' });
      }
      if (!user.isOmniscient) {
        user = await prisma.user.update({ where: { email }, data: { isOmniscient: true } });
      }
      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ message: "Connexion réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } });
    }

    if (!role || !currentSchool) {
      // Create a temporary token so we don"t reuse the OAuth code
      const tempToken = jwt.sign({ email, firstName: first_name, lastName: last_name }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(400).json({ 
        error: "Informations manquantes", 
        requireMoreInfo: true, 
        omniToken: tempToken,
        partialData: { email, firstName: first_name, lastName: last_name } 
      });
    }

    const randomPassword = require("crypto").randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: first_name || "",
        lastName: last_name || "",
        pseudo: req.body.pseudo || null,
        displayPreference: req.body.displayPreference || 'prénom nom',
        role,
        currentSchool,
        behanceLink,
        instaLink,
        personalLink,
        profilePicture: req.body.profilePicture || `/pdp_${Math.floor(Math.random() * 5) + 1}.webp`,
        isOmniscient: true,
        isEmailVerified: true
      },
    });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ message: "Inscription réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, pseudo: user.pseudo, displayPreference: user.displayPreference, profilePicture: user.profilePicture, isAdmin: user.isAdmin } });
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
      // Return 200 even if user is not found to prevent email enumeration
      return res.status(200).json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });
    }

    // Generate token
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
    
    // Configuration nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: process.env.SMTP_PORT || 465,
      secure: true, // true pour le port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Artchiv" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe Artchiv',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #EEEEEE; color: #111111; text-align: center; border-radius: 8px;">
      <div style="background-color: #111111; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #EEEEEE; margin: 0; font-size: 24px; letter-spacing: 1px;">ARCHIV</h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="margin-top: 0; color: #111111;">Réinitialisation de mot de passe</h2>
        <p style="color: #555555; line-height: 1.6; font-size: 16px;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valide pendant 1 heure.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #111111; color: #EEEEEE; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
          Réinitialiser le mot de passe
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #999999;">
          Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.<br/><br/>
          Si le bouton ne fonctionne pas, copiez-collez ce lien : <br/>
          <a href="${resetUrl}" style="color: #111111;">${resetUrl}</a>
        </p>
      </div>
    </div>
  `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[DEV] Email de réinitialisation envoyé à ${email}`);

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
        resetPasswordExpires: { gt: new Date() } // Ensures token is not expired
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
        emailVerificationExpires: { gt: new Date() } // not expired
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Le lien de vérification est invalide ou a expiré." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.status(200).json({ message: "Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la vérification de l'email" });
  }
};