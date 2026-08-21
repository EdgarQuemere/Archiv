const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const requireAdmin = require('../middlewares/adminAuth');

router.use(requireAdmin); // Protect all routes in this file

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/projects', adminController.getProjects);
router.delete('/projects/:id', adminController.deleteProject);

module.exports = router;
