// Não precisa de banco: executa o "up" de cada migration contra um "gravador" e confere
// que só há criação (createTable, addIndex, addColumn) e que nada usa sync().
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const migrationsDir = path.resolve(__dirname, '../../src/database/migrations');
const srcDir = path.resolve(__dirname, '../../src');
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js')).sort();

const EXPECTED_ORDER = [
  'create-users',
  'create-categories',
  'create-products',
  'create-product-images',
  'create-product-options',
  'create-product-categories',
  'add-extra-fields-to-products',
];

function recorder() {
  const calls = [];
  const queryInterface = new Proxy(
    {},
    {
      get(_, method) {
        if (typeof method === 'symbol') return undefined;
        return async (...args) => {
          calls.push({ method, args });
        };
      },
    },
  );
  return { queryInterface, calls };
}

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

describe('Migrations (análise estática)', () => {
  it('existem as 7 migrations na ordem planejada', () => {
    expect(files).toHaveLength(EXPECTED_ORDER.length);
    EXPECTED_ORDER.forEach((name, index) => {
      expect(files[index]).toMatch(new RegExp(`^\\d{14}-${name}\\.js$`));
    });
  });

  it.each(files)('%s: up só cria (createTable/addIndex/addColumn) e down existe', async (file) => {
    const migration = require(path.join(migrationsDir, file));
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');

    const { queryInterface, calls } = recorder();
    await migration.up(queryInterface, Sequelize);

    expect(calls.length).toBeGreaterThan(0);
    const methods = [...new Set(calls.map((c) => c.method))];
    methods.forEach((method) => {
      expect(['createTable', 'addIndex', 'addColumn']).toContain(method);
    });
  });

  it('tabelas referenciadas por chave estrangeira são criadas antes', async () => {
    const created = new Set();
    for (const file of files) {
      const migration = require(path.join(migrationsDir, file));
      const { queryInterface, calls } = recorder();
      await migration.up(queryInterface, Sequelize);

      calls
        .filter((c) => c.method === 'createTable')
        .forEach(({ args: [table, columns] }) => {
          Object.values(columns).forEach((column) => {
            if (column.references) expect(created.has(column.references.model)).toBe(true);
          });
          created.add(table);
        });
    }
    expect([...created].sort()).toEqual(
      ['categories', 'product_categories', 'product_images', 'product_options', 'products', 'users'],
    );
  });

  it('nenhum arquivo de src usa sync() do Sequelize', () => {
    const offenders = listJsFiles(srcDir).filter((file) =>
      /\.sync\s*\(/.test(fs.readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
