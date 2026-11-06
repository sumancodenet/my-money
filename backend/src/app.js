import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
// Timing header — see exact ms per API in browser Network (X-Response-Time)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Website API is running.', version: '1.0.0' });
});
app.use((req, res, next) => { const s = Date.now(); res.setHeader('X-Start-Time', String(s)); res.on('finish', () => { if (!res.headersSent) res.setHeader('X-Response-Time', `${Date.now() - s}ms`); }); next(); });
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 2000, message: { success: false, message: 'Too many requests, try again later.' } }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
export default app;
