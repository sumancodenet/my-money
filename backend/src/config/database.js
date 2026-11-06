import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  // Disable per-query console.log — RDS latency + logging = slow
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: { timestamps: true, underscored: false },
  // Keep pool warm — min:2 prevents cold-start to RDS on each request
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000, evict: 1000 },
  dialectOptions: {
    connectTimeout: 10000,
  },
  retry: { max: 3 },
});

export const testConnection = async () => {
  await sequelize.authenticate();
};
