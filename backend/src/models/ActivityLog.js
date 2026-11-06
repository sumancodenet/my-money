import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity: { type: DataTypes.STRING(50), allowNull: true },
  entityId: { type: DataTypes.STRING(50), allowNull: true },
  details: { type: DataTypes.JSON, allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
}, { tableName: 'ActivityLogs' });
