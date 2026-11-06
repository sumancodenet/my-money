import { body, param } from 'express-validator';

export const accountValidator = [
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('accountType').optional().isIn(['Savings', 'Current', 'Salary', 'Cash Wallet', 'Other']),
  body('openingBalance').optional().isFloat({ min: 0 }),
  body('openingDate').notEmpty().withMessage('Opening date is required').isDate(),
  body('ifsc').optional().matches(/^([A-Z]{4}0[A-Z0-9]{6}|)$/).withMessage('Invalid IFSC'),
  param('id').optional().isUUID(),
];
