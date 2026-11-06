import app from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/database.js';
import './models/index.js';
import { seedDefaultData } from './seeders/seed.js';

const start = async () => {
  try {
    await sequelize.authenticate();
    if (env.nodeEnv === 'development') {
      await sequelize.sync();
      await seedDefaultData();
    }
    app.listen(env.port);
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
};
start();
