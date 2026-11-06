import { User, Category, Setting } from '../models/index.js';

const incomeCats = ['Salary','Business','Freelancing','Interest','Cashback','Refund','Gift','Other'];
const expenseCats = ['Food & Grocery','Rent','Shopping','Electricity','Internet','Mobile Recharge','Travel','Fuel','Medical','Entertainment','Education','EMI','Loan','Household','Personal','Other'];
const colors = ['#7C3AED','#2563EB','#059669','#DC2626','#D97706','#0891B2','#DB2777','#4F46E5'];

export const seedDefaultData = async () => {
  for (const [i, name] of incomeCats.entries()) {
    await Category.findOrCreate({ where: { userId: null, name, type: 'Income' }, defaults: { name, type: 'Income', icon: 'Wallet', color: colors[i % colors.length], isDefault: true } });
  }
  for (const [i, name] of expenseCats.entries()) {
    await Category.findOrCreate({ where: { userId: null, name, type: 'Expense' }, defaults: { name, type: 'Expense', icon: 'Tag', color: colors[i % colors.length], isDefault: true } });
  }
  // Seeded silently
};
