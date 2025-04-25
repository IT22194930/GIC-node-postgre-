const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/Service/ServiceController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Regular service endpoints
// Get services for current user
router.get('/user', ServiceController.getUserServices);

// Get services for a specific organization
router.get('/organization/:organizationId', ServiceController.getOrganizationServices);

// Get service by ID
router.get('/:serviceId', ServiceController.getServiceById);

// Create a new service for an organization (submits for review)
router.post('/organization/:organizationId', ServiceController.createService);

// Update a service
router.put('/:serviceId/organization/:organizationId', ServiceController.updateService);

// Delete a service
router.delete('/:serviceId/organization/:organizationId', ServiceController.deleteService);

// New service review workflow endpoints
// Get services submitted by the current user
router.get('/submissions/user', ServiceController.getUserSubmittedServices);

// Delete a pending service submission
router.delete('/submissions/:serviceId', ServiceController.deleteServiceSubmission);

// Admin-only endpoints for service review
router.get('/pending-review', isAdmin, ServiceController.getPendingServices);
router.post('/review/:serviceId', isAdmin, ServiceController.reviewService);

module.exports = router;