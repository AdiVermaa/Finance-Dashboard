const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getAllUsers, getUserById, updateUser, deleteUser, updateUserValidation,
} = require('../controllers/userController');

// All user-management routes require admin
router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', updateUserValidation, validate, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
