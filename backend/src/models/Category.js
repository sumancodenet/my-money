import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  type: { type: DataTypes.ENUM('Income', 'Expense'), allowNull: false },
  icon: { type: DataTypes.STRING(50), defaultValue: 'Tag' },
  color: { type: DataTypes.STRING(20), defaultValue: '#7C3AED' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'Categories', indexes: [{ fields: ['userId', 'type'] }] });
