// Uso: npm run db:check  -> confirma que o .env permite conectar ao MySQL
require('../src/config/env');
const { sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      'SELECT VERSION() AS version, DATABASE() AS db, @@character_set_database AS charset',
    );
    console.log('Conexão OK:', rows[0]);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Falha na conexão:', error.message);
    process.exit(1);
  }
})();
