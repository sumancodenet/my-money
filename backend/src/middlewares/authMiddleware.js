import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authorized. Please login.');
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'name', 'email', 'role', 'currency'] });
    if (!user) throw new ApiError(401, 'User not found.');
    req.user = user;
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token.');
  }
});
