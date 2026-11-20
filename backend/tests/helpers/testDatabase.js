const { QueryTypes } = require('sequelize');

// Os testes que gravam/apagam dados só podem rodar neste banco.
const REQUIRED_TEST_DB = 'drip_store_test';

// Ordem segura para apagar (filhos antes dos pais)
const TABLES_IN_DELETE_ORDER = [
  'ProductCategory',
  'ProductImage',
  'ProductOption',
  'Product',
  'Category',
  'User',
];

function assertTestEnvironment() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `PROTEÇÃO: testes de banco só rodam com NODE_ENV=test (atual: "${process.env.NODE_ENV}"). Use "npm test".`,
    );
  }
  if (process.env.DB_NAME !== REQUIRED_TEST_DB) {
    throw new Error(
      `PROTEÇÃO: DB_NAME deve ser "${REQUIRED_TEST_DB}" nos testes (atual: "${process.env.DB_NAME}"). ` +
        'Confira o arquivo .env.test e variáveis DB_NAME exportadas no terminal.',
    );
  }
}

// Confirma, perguntando ao próprio MySQL, em qual banco a conexão está de fato.
async function assertSafeTestDatabase(sequelize) {
  assertTestEnvironment();
  const [row] = await sequelize.query('SELECT DATABASE() AS db', { type: QueryTypes.SELECT });
  if (!row || row.db !== REQUIRED_TEST_DB) {
    throw new Error(
      `PROTEÇÃO: conexão aponta para "${row && row.db}", não para "${REQUIRED_TEST_DB}". Nenhum teste foi executado.`,
    );
  }
}

// Confirma que as migrations já foram aplicadas no banco de testes.
async function assertMigrated(sequelize) {
  const rows = await sequelize.query(
    "SELECT COUNT(*) AS total FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users','categories','products','product_images','product_options','product_categories')",
    { type: QueryTypes.SELECT },
  );
  if (Number(rows[0].total) !== 6) {
    throw new Error(
      'O banco de testes ainda não tem as 6 tabelas. Rode antes: npm run db:migrate:test',
    );
  }
}

// Apaga os dados do BANCO DE TESTES (somente após a proteção acima).
async function cleanDatabase(db) {
  await assertSafeTestDatabase(db.sequelize);
  for (const modelName of TABLES_IN_DELETE_ORDER) {
    await db[modelName].destroy({ where: {} });
  }
}

module.exports = {
  REQUIRED_TEST_DB,
  assertTestEnvironment,
  assertSafeTestDatabase,
  assertMigrated,
  cleanDatabase,
};
