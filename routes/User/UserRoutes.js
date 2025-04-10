const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/User/UserController');

router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);

module.exports = router;
