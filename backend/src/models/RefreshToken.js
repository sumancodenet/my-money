import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'RefreshTokens', indexes: [{ fields: ['userId'] }, { fields: ['tokenHash'] }] });
