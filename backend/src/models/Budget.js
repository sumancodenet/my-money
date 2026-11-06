import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: true },
  name: { type: DataTypes.STRING(100), defaultValue: 'Monthly Budget' },
  budgetAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  month: { type: DataTypes.STRING(7), allowNull: false },
  isAlertEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'Budgets', indexes: [{ fields: ['userId', 'month'] }] });
