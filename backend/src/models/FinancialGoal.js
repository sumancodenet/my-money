import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const FinancialGoal = sequelize.define('FinancialGoal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  targetAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  targetDate: { type: DataTypes.DATEONLY, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  color: { type: DataTypes.STRING(20), defaultValue: '#7C3AED' },
}, { tableName: 'FinancialGoals' });
