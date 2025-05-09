// filepath: /Users/heshan/Downloads/Projects/GIC-node-postgre-/server/routes/Service/serviceRoutes.js
const express = require('express');
const router = express.Router();
const ServiceController = require('../../controllers/Service/ServiceController');
const { auth } = require('../../middleware/auth');

// Public routes
router.get('/', ServiceController.getAllServices);
router.get('/search', ServiceController.searchServices);
router.get('/organization/:organization_id', ServiceController.getServicesByOrganization);
router.get('/category/:category', ServiceController.getServicesByCategory);
router.get('/:id', ServiceController.getServiceById);

// Protected routes (require authentication)
router.post('/', auth, ServiceController.createService);
router.put('/:id', auth, ServiceController.updateService);
router.delete('/:id', auth, ServiceController.deleteService);

module.exports = router;