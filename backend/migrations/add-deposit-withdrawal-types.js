// One-time migration: Transactions.type ENUM me 'Deposit' aur 'Withdrawal'
// add karta hai. Sequelize sync() purani table ka ENUM update nahi karta,
// aur Vercel par sync chalta hi nahi — is liye ye script ek baar chalao:
//   cd backend && node migrations/add-deposit-withdrawal-types.js
import { sequelize } from '../src/config/database.js';
import '../src/models/index.js';

try {
  await sequelize.authenticate();
  await sequelize.query(
    `ALTER TABLE Transactions MODIFY COLUMN type ENUM(
      'Income','Expense','TransferIn','TransferOut','OpeningBalance','Adjustment','Deposit','Withdrawal'
    ) NOT NULL`
  );
  console.log('OK: Transactions.type ENUM me Deposit/Withdrawal add ho gaye.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
