const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domain.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public route to get all domains for dropdowns
router.get('/', domainController.getAllDomains);

// Protected routes (could be admin only, but for now just authenticated)
router.post('/', authMiddleware, domainController.createDomain);
router.delete('/:id', authMiddleware, domainController.deleteDomain);

module.exports = router;
