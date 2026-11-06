import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  category: { type: DataTypes.STRING(50), defaultValue: 'Other' },
  recurrence: { type: DataTypes.ENUM('Once', 'Monthly', 'Yearly'), defaultValue: 'Once' },
  isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'Reminders' });
