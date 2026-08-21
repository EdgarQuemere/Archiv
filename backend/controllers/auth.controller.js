const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');
const prisma = require('../config/db');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      email, password, firstName, lastName, role, currentSchool, 
      behanceLink, instaLink, personalLink, profilePicture 
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, firstName, lastName, role, currentSchool,
        behanceLink, instaLink, personalLink, profilePicture
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'Inscription réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
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

    res.json({ message: 'Connexion réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
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
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.isOmniscient) {
        user = await prisma.user.update({ where: { email }, data: { isOmniscient: true } });
      }
      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ message: 'Connexion réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
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
        role,
        currentSchool,
        behanceLink,
        instaLink,
        personalLink,
        profilePicture: picture || null
      },
    });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ message: 'Inscription réussie', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
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
      if (!user.isOmniscient) {
        user = await prisma.user.update({ where: { email }, data: { isOmniscient: true } });
      }
      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ message: "Connexion réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
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
        role,
        currentSchool,
        behanceLink,
        instaLink,
        personalLink,
        isOmniscient: true
      },
    });

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ message: "Inscription réussie", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error("Erreur Omniscient Auth:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erreur lors de l'authentification avec Omniscient" });
  }
};