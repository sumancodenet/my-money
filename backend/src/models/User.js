import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

export const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'admin' },
  currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
  resetToken: { type: DataTypes.STRING(255), allowNull: true },
  resetTokenExpires: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'Users', indexes: [{ unique: true, fields: ['email'] }] });

User.prototype.isPasswordValid = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

User.hashPassword = async (plain) => bcrypt.hash(plain, 12);
