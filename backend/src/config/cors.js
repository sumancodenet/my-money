import { env } from './env.js';

export const corsOptions = {
  origin: [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-CSRF-Token'],
};
