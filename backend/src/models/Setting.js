import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
  theme: { type: DataTypes.ENUM('Light', 'Dark', 'System'), defaultValue: 'Light' },
  notificationsEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  emailAlerts: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'Settings' });
