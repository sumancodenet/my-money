import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  accountId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.ENUM('Income', 'Expense', 'TransferIn', 'TransferOut', 'OpeningBalance', 'Adjustment'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, validate: { min: 0.01 } },
  transactionDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  description: { type: DataTypes.TEXT, allowNull: true },
  referenceNumber: { type: DataTypes.STRING(100), allowNull: true },
  transferReferenceId: { type: DataTypes.UUID, allowNull: true },
  relatedTransactionId: { type: DataTypes.UUID, allowNull: true },
  paymentMethod: { type: DataTypes.STRING(50), allowNull: true },
  attachmentUrl: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.ENUM('Posted', 'Reversed', 'Replaced'), defaultValue: 'Posted' },
  idempotencyKey: { type: DataTypes.STRING(100), allowNull: true },
}, {
  tableName: 'Transactions',
  indexes: [
    { fields: ['userId', 'transactionDate'] },
    { fields: ['accountId'] },
    { fields: ['categoryId'] },
    { fields: ['transferReferenceId'] },
    { fields: ['type'] },
    { fields: ['idempotencyKey'] },
  ],
});
