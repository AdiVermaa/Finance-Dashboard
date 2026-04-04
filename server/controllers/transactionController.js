const { body, query } = require('express-validator');
const Transaction = require('../models/Transaction');

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const {
      type, category, startDate, endDate,
      page = 1, limit = 10, sortBy = 'date', order = 'desc',
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('createdBy', 'name email role');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions  (admin, analyst)
const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;
    const transaction = await Transaction.create({
      title, amount, type, category,
      date: date || new Date(),
      notes,
      createdBy: req.user._id,
    });
    const populated = await transaction.populate('createdBy', 'name email role');
    res.status(201).json({ success: true, message: 'Transaction created.', transaction: populated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/transactions/:id  (admin, analyst)
const updateTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    // Analysts can only edit their own records
    if (req.user.role === 'analyst' && transaction.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Analysts can only edit their own transactions.' });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { title, amount, type, category, date, notes },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.status(200).json({ success: true, message: 'Transaction updated.', transaction: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id  (admin only — soft delete)
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Transaction soft-deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const transactionValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').isIn([
    'salary', 'freelance', 'investment', 'rental', 'other_income',
    'food', 'transport', 'utilities', 'healthcare', 'entertainment',
    'shopping', 'education', 'rent', 'other_expense',
  ]).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long'),
];

module.exports = {
  getTransactions, getTransactionById, createTransaction,
  updateTransaction, deleteTransaction, transactionValidation,
};
