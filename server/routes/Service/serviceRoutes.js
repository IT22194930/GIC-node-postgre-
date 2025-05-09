// filepath: /Users/heshan/Downloads/Projects/GIC-node-postgre-/server/routes/Service/serviceRoutes.js
const express = require('express');
const router = express.Router();
const ServiceController = require('../../controllers/Service/ServiceController');
const authMiddleware = require('../../middleware/auth');

// Public routes
router.get('/', ServiceController.getAllServices);
router.get('/search', ServiceController.searchServices);
router.get('/:id', ServiceController.getServiceById);
router.get('/organization/:organization_id', ServiceController.getServicesByOrganization);
router.get('/category/:category', ServiceController.getServicesByCategory);

// Protected routes (require authentication)
router.post('/', authMiddleware, ServiceController.createService);
router.put('/:id', authMiddleware, ServiceController.updateService);
router.delete('/:id', authMiddleware, ServiceController.deleteService);

module.exports = router;