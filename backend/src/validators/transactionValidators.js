import { body, param } from 'express-validator';

export const transactionValidator = [
  body('accountId').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('transactionDate').optional().isDate(),
  body('categoryId').optional().isUUID(),
];
export const transferValidator = [
  body('sourceAccountId').isUUID(),
  body('destinationAccountId').isUUID().custom((val, { req }) => val !== req.body.sourceAccountId || Promise.reject(new Error('Source and destination must differ'))),
  body('amount').isFloat({ min: 0.01 }),
  body('transferDate').optional().isDate(),
];
export const idParamValidator = [param('id').isUUID()];
export const movementValidator = [
  param('id').isUUID(),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('transactionDate').optional().isDate(),
  body('description').optional().isString(),
  body('referenceNumber').optional().isString(),
  body('paymentMethod').optional().isString(),
];
