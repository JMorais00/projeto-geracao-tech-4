require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
const { getJwtSecret } = require('./config/auth');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    getJwtSecret(); // falha cedo e com mensagem clara se o JWT_SECRET estiver vazio
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('Conexão com o MySQL estabelecida.');
  } catch (error) {
    console.error('Não foi possível conectar ao MySQL:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
}

start();
