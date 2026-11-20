require('./env');
const { redactSecrets } = require('../utils/redact');

// Lido pelo sequelize-cli (migrations/seeders) e por src/models/index.js
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  // logs de SQL (opcional) nunca mostram hashes de senha
  logging: process.env.DB_LOGGING === 'true' ? (message) => console.log(redactSecrets(message)) : false,
  dialectOptions: { charset: 'utf8mb4' },
  define: {
    underscored: true, // createdAt/updatedAt -> created_at/updated_at
  },
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
