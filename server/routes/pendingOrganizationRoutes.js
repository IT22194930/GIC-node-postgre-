const express = require('express');
const router = express.Router();
const PendingOrganizationController = require('../controllers/PendingOrganization/PendingOrganizationController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get pending organizations for current user
router.get('/user', PendingOrganizationController.getUserPendingOrganizations);

// Get all pending organizations (with optional status filter)
// Admin can see all, regular users see only their own
router.get('/', PendingOrganizationController.getPendingOrganizations);

// Get pending organization by ID
// Users can only view their own pending organization unless they're admin
router.get('/:id', PendingOrganizationController.getPendingOrganizationById);

// Create new pending organization
router.post('/', PendingOrganizationController.createPendingOrganization);

// Update pending organization
router.put('/:id', PendingOrganizationController.updatePendingOrganization);

// Update pending organization status (Admin only)
router.patch('/:id/status', isAdmin, PendingOrganizationController.updatePendingOrganizationStatus);

// Delete pending organization
router.delete('/:id', PendingOrganizationController.deletePendingOrganization);

module.exports = router;