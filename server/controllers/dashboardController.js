const Transaction = require('../models/Transaction');

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const [incomeResult, expenseResult, recentActivity, categoryBreakdown] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'income', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name'),
      Transaction.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const netBalance = totalIncome - totalExpenses;

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        savingsRate: totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0',
      },
      recentActivity,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/trends?period=monthly|weekly
const getTrends = async (req, res, next) => {
  try {
    const { period = 'monthly', year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    let groupFormat;
    if (period === 'weekly') {
      groupFormat = { year: { $year: '$date' }, week: { $week: '$date' } };
    } else {
      groupFormat = { year: { $year: '$date' }, month: { $month: '$date' } };
    }

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { period: groupFormat, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.period.year': 1, '_id.period.month': 1, '_id.period.week': 1 } },
    ]);

    // Pivot into { period, income, expense } shape
    const pivotMap = {};
    trends.forEach(({ _id, total }) => {
      const key = JSON.stringify(_id.period);
      if (!pivotMap[key]) pivotMap[key] = { period: _id.period, income: 0, expense: 0 };
      pivotMap[key][_id.type] = total;
    });

    res.status(200).json({
      success: true,
      period,
      year: targetYear,
      trends: Object.values(pivotMap),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/category-totals
const getCategoryTotals = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const match = { isDeleted: false };
    if (type) match.type = type;
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const totals = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 }, type: { $first: '$type' } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({ success: true, categoryTotals: totals });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getTrends, getCategoryTotals };
