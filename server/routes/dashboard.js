const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSummary, getTrends, getCategoryTotals } = require('../controllers/dashboardController');

// All authenticated users can access dashboard analytics
router.use(protect);

router.get('/summary', getSummary);
router.get('/trends', getTrends);
router.get('/category-totals', getCategoryTotals);

module.exports = router;
