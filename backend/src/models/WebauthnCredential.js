import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const WebauthnCredential = sequelize.define('WebauthnCredential', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  credentialId: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  publicKey: { type: DataTypes.TEXT, allowNull: false }, // base64 encoded (binary raw TEXT me corrupt ho jata hai)
  counter: { type: DataTypes.INTEGER, defaultValue: 0 },
  deviceName: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: 'WebauthnCredentials', indexes: [{ fields: ['userId'] }, { fields: ['credentialId'] }] });
