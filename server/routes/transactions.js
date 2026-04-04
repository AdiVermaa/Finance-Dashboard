const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getTransactions, getTransactionById, createTransaction,
  updateTransaction, deleteTransaction, transactionValidation,
} = require('../controllers/transactionController');

// All routes require authentication
router.use(protect);

// Analyst and Admin can read
router.get('/', authorize('analyst', 'admin'), getTransactions);
router.get('/:id', authorize('analyst', 'admin'), getTransactionById);

// Admin can create/update
router.post('/', authorize('admin'), transactionValidation, validate, createTransaction);
router.patch('/:id', authorize('admin'), transactionValidation, validate, updateTransaction);

// Only Admin can delete (soft-delete)
router.delete('/:id', authorize('admin'), deleteTransaction);

module.exports = router;
