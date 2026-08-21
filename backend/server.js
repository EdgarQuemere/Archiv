require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

// Initialisation de l'application
const app = express();


app.set('trust proxy', 1);

// --- MIDDLEWARES GLOBAUX ---
app.use(helmet());
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3006', 'https://artchiv.fr', 'https://www.artchiv.fr'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Dossier public pour accéder aux fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- IMPORT DES ROUTES & SWAGGER ---
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const domainRoutes = require('./routes/domain.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// --- DÉCLARATION DES ROUTES ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);


// --- LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
