const { body } = require('express-validator');
const User = require('../models/User');

// GET /api/users  (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id  (admin only)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id  (admin only)
const updateUser = async (req, res, next) => {
  try {
    const { name, role, status } = req.body;

    // Prevent self-role demotion
    if (req.params.id === req.user._id.toString() && role && role !== req.user.role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(role && { role }), ...(status && { status }) },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User updated.', user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id  (admin only)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, updateUserValidation };
