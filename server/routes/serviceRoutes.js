const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/Service/ServiceController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Regular service endpoints
// Get services for current user
router.get('/user', ServiceController.getUserServices);

// Admin-only endpoints for service review
router.get('/pending-review', isAdmin, ServiceController.getPendingServices);
router.post('/review/:serviceId', isAdmin, ServiceController.reviewService);

// New service review workflow endpoints
// Get services submitted by the current user
router.get('/submissions/user', ServiceController.getUserSubmittedServices);

// Delete a pending service submission
router.delete('/submissions/:serviceId', ServiceController.deleteServiceSubmission);

// Get services for a specific organization
router.get('/organization/:organizationId', ServiceController.getOrganizationServices);

// Create a new service for an organization (submits for review)
router.post('/organization/:organizationId', ServiceController.createService);

// NOTE: The routes that use parameters like :serviceId must come AFTER the more specific routes
// Update a service
router.put('/:serviceId/organization/:organizationId', ServiceController.updateService);

// Delete a service
router.delete('/:serviceId/organization/:organizationId', ServiceController.deleteService);

// Get service by ID
router.get('/:serviceId', ServiceController.getServiceById);

module.exports = router;