import 'mysql2';
import app from '../src/app.js';
import { sequelize } from '../backend/src/models/index.js';

let dbReady = null;

const ensureDb = () => {
  if (!dbReady) {
    dbReady = sequelize.authenticate().catch((error) => {
      dbReady = null;
      throw error;
    });
  }
  return dbReady;
};

export default async (req, res) => {
  try {
    await ensureDb();
  } catch (error) {
    console.error('Database init failed:', error);
    res.status(500).json({ success: false, message: 'Database connection failed.' });
    return;
  }
  return app(req, res);
};
