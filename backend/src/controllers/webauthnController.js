import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User, WebauthnCredential, RefreshToken } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const RP_NAME = 'MoneyFlow';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const ACCESS_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: ACCESS_MAX_AGE };
const refreshOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: REFRESH_MAX_AGE };
const signToken = (user) => jwt.sign({ id: user.id }, env.jwt.secret, { expiresIn: '7d' });
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// In-memory challenges (Map: key -> { challenge, expires })
export const challenges = new Map();
const challengeKey = (type, id) => `${type}:${id}`;
const setChallenge = (type, id, challenge) => challenges.set(challengeKey(type, id), { challenge, expires: Date.now() + 10 * 60 * 1000 });
const getChallenge = (type, id) => {
  const entry = challenges.get(challengeKey(type, id));
  if (!entry || entry.expires < Date.now()) return null;
  challenges.delete(challengeKey(type, id));
  return entry.challenge;
};

const issueTokens = async (user, res) => {
  const accessToken = signToken(user);
  const rawRefresh = crypto.randomBytes(32).toString('hex');
  await RefreshToken.create({ userId: user.id, tokenHash: hashToken(rawRefresh), expiresAt: new Date(Date.now() + REFRESH_MAX_AGE) });
  res.cookie('token', accessToken, cookieOpts);
  res.cookie('refreshToken', rawRefresh, refreshOpts);
  return { accessToken };
};

export const registerOptions = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const existing = await WebauthnCredential.findAll({ where: { userId: user.id } });
  const excludeCredentials = existing.map(c => ({ id: c.credentialId, type: 'public-key' }));
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  setChallenge('reg', user.id, options.challenge);
  sendSuccess(res, 200, 'Registration options', options);
});

export const registerVerify = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const expected = getChallenge('reg', user.id);
  if (!expected) throw new ApiError(400, 'Challenge expired. Please try again.');
  let verification;
  try {
    verification = await verifyRegistrationResponse({ response: req.body, expectedChallenge: expected, expectedOrigin: ORIGIN, expectedRPID: RP_ID });
  } catch (e) { throw new ApiError(400, 'Fingerprint registration failed: ' + e.message); }
  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
  await WebauthnCredential.create({ userId: user.id, credentialId: credentialID, publicKey: credentialPublicKey, counter, deviceName: req.body.deviceName || 'Device' });
  sendSuccess(res, 201, 'Fingerprint registered successfully');
});

export const loginOptions = asyncHandler(async (req, res) => {
  const email = req.query.email || req.body?.email;
  const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: 'preferred' });
  if (email) {
    const user = await User.findOne({ where: { email } });
    if (user) setChallenge('login', user.id, options.challenge);
  } else {
    setChallenge('login', 'anonymous', options.challenge);
  }
  sendSuccess(res, 200, 'Login options', options);
});

export const loginVerify = asyncHandler(async (req, res) => {
  const { id: credentialId, response } = req.body;
  const cred = await WebauthnCredential.findOne({ where: { credentialId } });
  if (!cred) throw new ApiError(400, 'Fingerprint not registered for this device');
  const user = await User.findByPk(cred.userId);
  const expected = getChallenge('login', user.id) || getChallenge('login', 'anonymous');
  if (!expected) throw new ApiError(400, 'Challenge expired. Please try again.');
  let verification;
  try {
    verification = await verifyAuthenticationResponse({ response: req.body, expectedChallenge: expected, expectedOrigin: ORIGIN, expectedRPID: RP_ID, credential: { id: cred.credentialId, publicKey: cred.publicKey, counter: cred.counter } });
  } catch (e) { throw new ApiError(401, 'Fingerprint verification failed: ' + e.message); }
  if (!verification.success) throw new ApiError(401, 'Fingerprint verification failed');
  cred.counter = verification.authenticationInfo.newCounter;
  await cred.save();
  const { accessToken } = await issueTokens(user, res);
  sendSuccess(res, 200, 'Fingerprint login successful', { user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency }, token: accessToken });
});

export const listCredentials = asyncHandler(async (req, res) => {
  const creds = await WebauthnCredential.findAll({ where: { userId: req.user.id }, attributes: ['id', 'credentialId', 'deviceName', 'createdAt'] });
  sendSuccess(res, 200, 'Credentials fetched', creds);
});

export const deleteCredential = asyncHandler(async (req, res) => {
  const cred = await WebauthnCredential.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cred) throw new ApiError(404, 'Credential not found');
  await cred.destroy();
  sendSuccess(res, 200, 'Fingerprint removed');
});
