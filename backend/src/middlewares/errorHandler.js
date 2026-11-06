import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  if (process.env.NODE_ENV === 'development') console.error(err);
  res.status(status).json({ success: false, message, data: null, pagination: null });
};

export const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.originalUrl}`));
