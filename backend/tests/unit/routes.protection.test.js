// Garante que nenhum POST/PUT/PATCH/DELETE ficou sem autenticação, salvo as exceções documentadas.
const userRoutes = require('../../src/routes/user.routes');
const categoryRoutes = require('../../src/routes/category.routes');
const { requireAuth } = require('../../src/middleware/auth');
const { sequelize } = require('../../src/models');

const WRITE_METHODS = ['post', 'put', 'patch', 'delete'];

function listWriteRoutes(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods)
        .filter((method) => WRITE_METHODS.includes(method))
        .map((method) => ({
          key: `${method} ${layer.route.path}`,
          protectedByAuth: layer.route.stack.some((item) => item.handle === requireAuth),
        })),
    );
}

// Para cada router: rotas de escrita esperadas e as públicas (exceções à regra "todo POST/PUT/DELETE exige token").
// Novos routers (ex.: produtos) devem ser acrescentados aqui.
const ROUTERS = [
  {
    name: '/v1/user',
    router: userRoutes,
    expected: ['delete /:id', 'post /', 'post /token', 'put /:id'],
    publicWrites: ['post /', 'post /token'], // sem elas não há cadastro nem login
  },
  {
    name: '/v1/category',
    router: categoryRoutes,
    expected: ['delete /:id', 'post /', 'put /:id'],
    publicWrites: [],
  },
];

afterAll(async () => {
  await sequelize.close();
});

describe.each(ROUTERS)('proteção das rotas de escrita de $name', ({ router, expected, publicWrites }) => {
  const routes = listWriteRoutes(router);

  it('encontra as rotas de escrita esperadas', () => {
    expect(routes.map((route) => route.key).sort()).toEqual(expected);
  });

  it('todo POST/PUT/DELETE exige token, exceto as exceções documentadas', () => {
    const unprotected = routes.filter((route) => !route.protectedByAuth).map((route) => route.key).sort();
    expect(unprotected).toEqual([...publicWrites].sort());
  });
});
