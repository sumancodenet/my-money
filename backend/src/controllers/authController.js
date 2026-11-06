import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { User, RefreshToken } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const ACCESS_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: ACCESS_MAX_AGE };
const refreshOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: REFRESH_MAX_AGE };
const signToken = (user) => jwt.sign({ id: user.id }, env.jwt.secret, { expiresIn: '7d' });

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

const issueTokens = async (user, res) => {
  const accessToken = signToken(user);
  const rawRefresh = crypto.randomBytes(32).toString('hex');
  await RefreshToken.create({ userId: user.id, tokenHash: hashToken(rawRefresh), expiresAt: new Date(Date.now() + REFRESH_MAX_AGE) });
  res.cookie('token', accessToken, cookieOpts);
  res.cookie('refreshToken', rawRefresh, refreshOpts);
  return { accessToken };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.isPasswordValid(password))) throw new ApiError(401, 'Invalid email or password.');
  const { accessToken } = await issueTokens(user, res);
  sendSuccess(res, 200, 'Login successful', { user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency }, token: accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) throw new ApiError(401, 'Refresh token missing. Please login again.');
  const stored = await RefreshToken.findOne({ where: { tokenHash: hashToken(raw) } });
  if (!stored || new Date(stored.expiresAt) < new Date()) {
    res.clearCookie('token', cookieOpts); res.clearCookie('refreshToken', refreshOpts);
    throw new ApiError(401, 'Session expired. Please login again.');
  }
  const user = await User.findByPk(stored.userId);
  if (!user) throw new ApiError(401, 'User not found.');
  await stored.destroy();
  const { accessToken } = await issueTokens(user, res);
  sendSuccess(res, 200, 'Token refreshed', { token: accessToken });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) throw new ApiError(400, 'Email already registered.');
  const user = await User.create({ name, email, passwordHash: await User.hashPassword(password) });
  sendSuccess(res, 201, 'Account created. Please login.', { id: user.id, name: user.name, email: user.email });
});

export const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (raw) await RefreshToken.destroy({ where: { tokenHash: hashToken(raw) } });
  res.clearCookie('token', cookieOpts);
  res.clearCookie('refreshToken', refreshOpts);
  sendSuccess(res, 200, 'Logged out successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'role', 'currency', 'createdAt'] });
  sendSuccess(res, 200, 'Profile fetched', { user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
  }
  sendSuccess(res, 200, 'If an account exists for this email, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({ where: { resetToken: token } });
  if (!user || new Date(user.resetTokenExpires) < new Date()) throw new ApiError(400, 'Invalid or expired token.');
  user.passwordHash = await User.hashPassword(newPassword);
  user.resetToken = null; user.resetTokenExpires = null;
  await user.save();
  sendSuccess(res, 200, 'Password reset successful.');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!(await user.isPasswordValid(currentPassword))) throw new ApiError(400, 'Current password incorrect.');
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  sendSuccess(res, 200, 'Password changed successfully.');
});
