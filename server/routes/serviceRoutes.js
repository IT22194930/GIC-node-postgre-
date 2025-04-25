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

// Get all services (admin only)
router.get('/all', isAdmin, ServiceController.getAllServices);

// Delete service directly by ID (admin only)
router.delete('/:serviceId', isAdmin, ServiceController.deleteServiceById);

// Update service status directly (admin only)
router.patch('/:serviceId/status', isAdmin, ServiceController.updateServiceStatus);

// New service review workflow endpoints
// Get services submitted by the current user
router.get('/submissions/user', ServiceController.getUserSubmittedServices);

// Delete a pending service submission
router.delete('/submissions/:serviceId', ServiceController.deleteServiceSubmission);

// Submit a service for approval (moves from services_for_review to services table)
router.post('/submissions/:serviceId/submit', ServiceController.submitServiceForApproval);

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