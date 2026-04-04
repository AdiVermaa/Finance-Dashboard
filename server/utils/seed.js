require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require(path.join(__dirname, '../models/User'));
const Transaction = require(path.join(__dirname, '../models/Transaction'));
const connectDB = require(path.join(__dirname, '../config/db'));

const CATEGORIES_INCOME = ['salary', 'freelance', 'investment', 'rental'];
const CATEGORIES_EXPENSE = ['food', 'transport', 'utilities', 'healthcare', 'entertainment', 'shopping', 'rent'];

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Transaction.deleteMany({});
  console.log('🗑  Cleared existing data');

  // Create users
  const users = await User.create([
    { name: 'Admin User',    email: 'admin@zorvyn.com',   password: 'admin123',   role: 'admin'   },
    { name: 'Alice Analyst', email: 'analyst@zorvyn.com', password: 'analyst123', role: 'analyst' },
    { name: 'Bob Viewer',    email: 'viewer@zorvyn.com',  password: 'viewer123',  role: 'viewer'  },
  ]);
  console.log('👤 Created 3 users (admin, analyst, viewer)');

  // Create 40 sample transactions spread over past 6 months
  const txDocs = [];
  for (let i = 0; i < 40; i++) {
    const isIncome = Math.random() > 0.45;
    txDocs.push({
      title: isIncome ? `Income Entry #${i + 1}` : `Expense Entry #${i + 1}`,
      amount: isIncome ? rand(1000, 8000) : rand(50, 2500),
      type: isIncome ? 'income' : 'expense',
      category: isIncome ? randItem(CATEGORIES_INCOME) : randItem(CATEGORIES_EXPENSE),
      date: daysAgo(Math.floor(Math.random() * 180)),
      notes: Math.random() > 0.5 ? 'Auto-generated seed record' : '',
      createdBy: randItem(users)._id,
    });
  }
  await Transaction.create(txDocs);
  console.log('💰 Created 40 sample transactions');

  console.log('\n✅ Seed complete! Login credentials:');
  console.log('   admin@zorvyn.com   / admin123');
  console.log('   analyst@zorvyn.com / analyst123');
  console.log('   viewer@zorvyn.com  / viewer123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
