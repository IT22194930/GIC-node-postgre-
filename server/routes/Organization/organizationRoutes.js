const express = require('express');
const router = express.Router();
const OrganizationController = require('../../controllers/Organization/OrganizationController');
const { auth, isAdmin } = require('../../middleware/auth');

// All routes require authentication
router.use(auth);

// Get organizations for current user
router.get('/user', OrganizationController.getUserOrganizations);

// Get all organizations (with optional status filter)
// Admin can see all, regular users see only their own
router.get('/', OrganizationController.getOrganizations);

// Get organization by ID
// Users can only view their own organization unless they're admin
router.get('/:id', OrganizationController.getOrganizationById);

// Create new organization
router.post('/', OrganizationController.createOrganization);

// Update organization
router.put('/:id', OrganizationController.updateOrganization);

// Update organization status (Admin only)
router.patch('/:id/status', isAdmin, OrganizationController.updateOrganizationStatus);

// Delete organization
router.delete('/:id', OrganizationController.deleteOrganization);

module.exports = router;