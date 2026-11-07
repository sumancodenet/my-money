import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import { env } from './env.js';

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: Number(env.db.port),
    dialect: 'mysql',
    dialectModule: mysql2,

    logging: process.env.DB_LOGGING === 'true' ? console.log : false,

    define: {
      timestamps: true,
      underscored: false,
    },

    pool: {
      max: 3,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    dialectOptions: {
      connectTimeout: 10000,
    },

    retry: {
      max: 3,
    },
  }
);

export const testConnection = async () => {
  await sequelize.authenticate();
};