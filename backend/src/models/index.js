import { User } from './User.js';
import { Account } from './Account.js';
import { Category } from './Category.js';
import { Transaction } from './Transaction.js';
import { Budget } from './Budget.js';
import { FinancialGoal } from './FinancialGoal.js';
import { Reminder } from './Reminder.js';
import { ActivityLog } from './ActivityLog.js';
import { Setting } from './Setting.js';
import { RefreshToken } from './RefreshToken.js';
import { WebauthnCredential } from './WebauthnCredential.js';

// Associations
User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Account.hasMany(Transaction, { foreignKey: 'accountId', onDelete: 'RESTRICT' });
Transaction.belongsTo(Account, { foreignKey: 'accountId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });
Category.hasMany(Budget, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
Budget.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(FinancialGoal, { foreignKey: 'userId', onDelete: 'CASCADE' });
FinancialGoal.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Reminder, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reminder.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Setting, { foreignKey: 'userId', onDelete: 'CASCADE' });
Setting.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ActivityLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(WebauthnCredential, { foreignKey: 'userId', onDelete: 'CASCADE' });
WebauthnCredential.belongsTo(User, { foreignKey: 'userId' });

export { User, Account, Category, Transaction, Budget, FinancialGoal, Reminder, ActivityLog, Setting, RefreshToken, WebauthnCredential };
