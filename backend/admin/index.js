const prisma = require('../config/db');
const bcrypt = require('bcrypt');

const setupAdmin = async (app) => {
  const adminjsModule = await import('adminjs');
  const AdminJS = adminjsModule.default;
  const { ComponentLoader } = adminjsModule;
  const AdminJSExpress = await import('@adminjs/express');
  const { Database, Resource } = await import('@adminjs/prisma');

  AdminJS.registerAdapter({ Database, Resource });
  
  const componentLoader = new ComponentLoader();
  const components = {
    ImagePreview: componentLoader.add('ImagePreview', './components/image-preview.jsx'),
  };

  const adminOptions = {
    componentLoader,
    resources: [
      {
        resource: { model: prisma.user, client: prisma },
        options: {
          properties: {
            password: { isVisible: false },
            profilePicture: {
              components: {
                list: components.ImagePreview,
                show: components.ImagePreview,
              }
            }
          }
        }
      },
      { resource: { model: prisma.project, client: prisma } },
      { resource: { model: prisma.domain, client: prisma } },
      { resource: { model: prisma.savedProject, client: prisma } },
    ],
    rootPath: '/admin',
    branding: {
      companyName: 'Archiv Admin',
      softwareBrothers: false,
      logo: false,
    },
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email, password) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && user.isAdmin) {
          const matched = await bcrypt.compare(password, user.password);
          if (matched) {
            return user;
          }
        }
        return null;
      },
      cookieName: 'adminjs',
      cookiePassword: process.env.JWT_SECRET || 'some-super-secret-password-which-is-long',
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
      secret: process.env.JWT_SECRET || 'some-super-secret-password',
    }
  );

  app.use(admin.options.rootPath, adminRouter);
};

module.exports = setupAdmin;
