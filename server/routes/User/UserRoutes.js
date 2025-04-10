const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/User/UserController');
const { auth, isAdmin } = require('../../middleware/auth');

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes (require authentication)
router.get('/me', auth, UserController.getUserProfile);
router.put('/me', auth, UserController.updateUserProfile);

// Admin-only routes (require both authentication and admin role)
router.get('/', auth, isAdmin, UserController.getAllUsers);
router.get('/:id', auth, isAdmin, UserController.getUserById);
router.put('/:id', auth, isAdmin, UserController.updateUser);
router.delete('/:id', auth, isAdmin, UserController.deleteUser);

module.exports = router;
