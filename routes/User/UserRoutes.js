const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/User/UserController');
const auth = require('../../middleware/auth');

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes
router.get('/', auth, UserController.getAllUsers);
router.get('/:id', auth, UserController.getUserById);
router.put('/:id', auth, UserController.updateUser);
router.delete('/:id', auth, UserController.deleteUser);

module.exports = router;
