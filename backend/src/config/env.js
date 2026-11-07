import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'moneyflow',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me-32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // WebAuthn: env OPTIONAL hai. Na set ho to controller request ke domain se
  // khud RP_ID/ORIGIN bana leta hai (localhost dev + Vercel dono par chalega).
  // Sirf tab set karo jab frontend aur backend alag-alag domain par hon.
  webauthn: {
    rpName: process.env.RP_NAME || 'MoneyFlow',
    rpId: process.env.RP_ID || null,
    origin: process.env.ORIGIN || null,
  },
};
