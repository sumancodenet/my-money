export const INCOME_CATEGORIES = ['Salary','Business','Freelancing','Interest','Cashback','Refund','Gift','Other'];
export const EXPENSE_CATEGORIES = ['Food & Grocery','Rent','Shopping','Electricity','Internet','Mobile Recharge','Travel','Fuel','Medical','Entertainment','Education','EMI','Loan','Household','Personal','Other'];
export const ACCOUNT_TYPES = ['Savings','Current','Salary','Cash Wallet','Other'];
export const TRANSACTION_TYPES = ['Income','Expense','TransferIn','TransferOut','OpeningBalance','Adjustment','Deposit','Withdrawal'];
// Credit = balance badhta hai, Debit = balance ghatta hai. Deposit/Withdrawal
// apni cash <-> bank movement hai, is liye Income/Expense me count nahi hote.
export const CREDIT_TYPES = ['Income', 'TransferIn', 'OpeningBalance', 'Adjustment', 'Deposit'];
export const DEBIT_TYPES = ['Expense', 'TransferOut', 'Withdrawal'];
