export const INCOME_CATEGORIES = ['Salary','Business','Freelancing','Interest','Cashback','Refund','Gift','Other'];
export const EXPENSE_CATEGORIES = ['Food & Grocery','Rent','Shopping','Electricity','Internet','Mobile Recharge','Travel','Fuel','Medical','Entertainment','Education','EMI','Loan','Household','Personal','Other'];
export const ACCOUNT_TYPES = ['Savings','Current','Salary','Cash Wallet','Other'];
export const TRANSACTION_TYPES = ['Income','Expense','TransferIn','TransferOut','OpeningBalance','Adjustment','Deposit','Withdrawal'];
// Credit increases the balance, Debit decreases it. Deposit/Withdrawal are
// cash <-> bank movements, so they are not counted as Income/Expense.
export const CREDIT_TYPES = ['Income', 'TransferIn', 'OpeningBalance', 'Adjustment', 'Deposit'];
export const DEBIT_TYPES = ['Expense', 'TransferOut', 'Withdrawal'];
