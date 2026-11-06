import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Account = sequelize.define('Account', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  bankName: { type: DataTypes.STRING(100), allowNull: false },
  accountHolderName: { type: DataTypes.STRING(100), allowNull: true },
  accountType: { type: DataTypes.ENUM('Savings', 'Current', 'Salary', 'Cash Wallet', 'Other'), defaultValue: 'Savings' },
  maskedAccountNumber: { type: DataTypes.STRING(50), allowNull: true },
  ifsc: { type: DataTypes.STRING(20), allowNull: true },
  openingBalance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  openingDate: { type: DataTypes.DATEONLY, allowNull: false },
  accountColor: { type: DataTypes.STRING(20), defaultValue: '#7C3AED' },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('Active', 'Archived', 'Inactive'), defaultValue: 'Active' },
  allowOverdraft: { type: DataTypes.BOOLEAN, defaultValue: false },
  overdraftLimit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
}, { tableName: 'Accounts', indexes: [{ fields: ['userId'] }, { fields: ['status'] }] });
