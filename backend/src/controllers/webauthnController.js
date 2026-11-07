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

// @simplewebauthn/server v14 API:
// - verifyRegistrationResponse -> { verified, registrationInfo: { credential: { id, publicKey, counter } } }
//   (purana v10 style credentialID / credentialPublicKey ab nahi hai)
// - verifyAuthenticationResponse -> { verified, authenticationInfo: { newCounter } }
//   (purana verification.success field ab nahi hai, verified hai)
const RP_NAME = env.webauthn.rpName;

// Bina env ke kaam kare — request ke domain se khud decide karo:
// - localhost dev: RP_ID=localhost, ORIGIN=http://localhost:5173 (vite frontend)
// - Vercel/production (frontend+backend same domain): RP_ID/ORIGIN = request ka host
// Env (RP_ID/ORIGIN) sirf override ke liye hai, zaroori nahi.
const getWebAuthnConfig = (req) => {
  if (env.webauthn.rpId && env.webauthn.origin) return { rpId: env.webauthn.rpId, origin: env.webauthn.origin };
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const hostname = host.split(':')[0];
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return { rpId: 'localhost', origin: 'http://localhost:5173' };
  }
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return { rpId: hostname, origin: `${proto}://${host}` };
};
const ACCESS_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: ACCESS_MAX_AGE };
const refreshOpts = { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: REFRESH_MAX_AGE };
const signToken = (user) => jwt.sign({ id: user.id }, env.jwt.secret, { expiresIn: '7d' });
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Public key binary hai — TEXT column me raw store karne se corrupt ho jati thi.
// Base64 string me store karo, verify se pehle wapas Uint8Array banao.
const encodePublicKey = (u8) => Buffer.from(u8).toString('base64');
const decodePublicKey = (stored) => {
  if (!stored) return stored;
  if (stored instanceof Uint8Array) return new Uint8Array(stored);
  if (typeof stored === 'string') {
    // Purana (corrupt-safe) format: "12,34,56,..." comma list
    if (/^\d+(,\d+)*$/.test(stored.trim())) return Uint8Array.from(stored.split(',').map(Number));
    return new Uint8Array(Buffer.from(stored, 'base64'));
  }
  return stored;
};

// In-memory challenges (Map: key -> { challenge, expires })
// NOTE: Vercel serverless par har instance ka alag Map hota hai — options aur
// verify aam taur par same warm instance par lagte hain. Multi-instance
// production ke liye challenge ko DB/Redis me rakhna parega.
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
  const { rpId: RP_ID } = getWebAuthnConfig(req);
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found.');
  const existing = await WebauthnCredential.findAll({ where: { userId: user.id } });
  const excludeCredentials = existing.map(c => ({ id: c.credentialId }));
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.name || user.email,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
  setChallenge('reg', user.id, options.challenge);
  sendSuccess(res, 200, 'Registration options', options);
});

export const registerVerify = asyncHandler(async (req, res) => {
  const { rpId: RP_ID, origin: ORIGIN } = getWebAuthnConfig(req);
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found.');
  const expected = getChallenge('reg', user.id);
  if (!expected) throw new ApiError(400, 'Challenge expired. Please try again.');
  let verification;
  try {
    verification = await verifyRegistrationResponse({ response: req.body, expectedChallenge: expected, expectedOrigin: ORIGIN, expectedRPID: RP_ID });
  } catch (e) { throw new ApiError(400, 'Fingerprint registration failed: ' + e.message); }
  if (!verification.verified || !verification.registrationInfo) {
    throw new ApiError(400, 'Fingerprint registration could not be verified. Please try again.');
  }
  // v14: credential is registrationInfo.credential = { id, publicKey, counter }
  const { id: credentialId, publicKey, counter } = verification.registrationInfo.credential;
  const dupe = await WebauthnCredential.findOne({ where: { credentialId } });
  if (dupe) throw new ApiError(400, 'This fingerprint is already registered. Use it to sign in, or remove it from settings first.');
  await WebauthnCredential.create({
    userId: user.id,
    credentialId,
    publicKey: encodePublicKey(publicKey),
    counter: counter || 0,
    deviceName: req.body.deviceName || 'Device',
  });
  sendSuccess(res, 201, 'Fingerprint registered successfully');
});

export const loginOptions = asyncHandler(async (req, res) => {
  const { rpId: RP_ID } = getWebAuthnConfig(req);
  const email = String(req.query.email || req.body?.email || '').trim().toLowerCase() || null;
  let user = null;
  let allowCredentials;
  if (email) {
    user = await User.findOne({ where: { email } });
    if (user) {
      const creds = await WebauthnCredential.findAll({ where: { userId: user.id } });
      // Email wale user ke credentials browser ko pehle se bata do — non-discoverable
      // credentials (kuch Windows Hello setups) isi se kaam karte hain.
      if (creds.length) allowCredentials = creds.map(c => ({ id: c.credentialId }));
    }
  }
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: 'required',
  });
  // Challenge dono keys par rakho — verify ke waqt credential ka owner maloom
  // hone par sahi key se uth jayega (email galat/default ho to bhi kaam karega)
  setChallenge('login', 'anonymous', options.challenge);
  if (user) setChallenge('login', user.id, options.challenge);
  sendSuccess(res, 200, 'Login options', options);
});

export const loginVerify = asyncHandler(async (req, res) => {
  const { rpId: RP_ID, origin: ORIGIN } = getWebAuthnConfig(req);
  const credentialId = req.body?.id;
  if (!credentialId) throw new ApiError(400, 'Credential id missing.');
  const cred = await WebauthnCredential.findOne({ where: { credentialId } });
  if (!cred) throw new ApiError(400, 'Fingerprint not registered for this device. Please register it in Settings first.');
  const user = await User.findByPk(cred.userId);
  if (!user) throw new ApiError(404, 'User not found.');
  const expected = getChallenge('login', user.id) || getChallenge('login', 'anonymous');
  if (!expected) throw new ApiError(400, 'Challenge expired. Please try again.');
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: expected,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: { id: cred.credentialId, publicKey: decodePublicKey(cred.publicKey), counter: cred.counter || 0 },
    });
  } catch (e) { throw new ApiError(401, 'Fingerprint verification failed: ' + e.message); }
  // v14 field: verified (purana success nahi) — iske baghair har login fail hota tha
  if (!verification.verified) throw new ApiError(401, 'Fingerprint verification failed');
  const newCounter = verification.authenticationInfo?.newCounter;
  if (typeof newCounter === 'number' && newCounter > 0) {
    cred.counter = newCounter;
    await cred.save();
  }
  const { accessToken } = await issueTokens(user, res);
  sendSuccess(res, 200, 'Fingerprint login successful', { user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency }, token: accessToken });
});

export const listCredentials = asyncHandler(async (req, res) => {
  const creds = await WebauthnCredential.findAll({ where: { userId: req.user.id }, attributes: ['id', 'credentialId', 'deviceName', 'counter', 'createdAt', 'updatedAt'] });
  sendSuccess(res, 200, 'Credentials fetched', creds);
});

export const deleteCredential = asyncHandler(async (req, res) => {
  const cred = await WebauthnCredential.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cred) throw new ApiError(404, 'Credential not found');
  await cred.destroy();
  sendSuccess(res, 200, 'Fingerprint removed');
});
