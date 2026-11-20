// Testes de integração dos endpoints /v1/category (Supertest + MySQL).
// Gravam e apagam dados SOMENTE em drip_store_test (proteção em tests/helpers/testDatabase.js).
// Rode antes: npm run db:migrate:test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste-integracao';

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');
const { assertSafeTestDatabase, assertMigrated, cleanDatabase } = require('../helpers/testDatabase');

const { sequelize, Category, Product, ProductCategory, User } = db;

const PASSWORD = '123@123';
const bearer = (token) => `Bearer ${token}`;

async function createUserAndToken() {
  const register = await request(app).post('/v1/user').send({
    firstname: 'Maria',
    surname: 'Silva',
    email: 'maria@mail.com',
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  expect(register.status).toBe(201);
  const login = await request(app).post('/v1/user/token').send({ email: 'maria@mail.com', password: PASSWORD });
  expect(login.status).toBe(200);
  return { user: register.body, token: login.body.token };
}

// Cria N categorias em ordem; as de posição par (0, 2, 4...) têm use_in_menu = true.
async function seedCategories(total) {
  const rows = Array.from({ length: total }, (_, index) => ({
    name: `Categoria ${String(index + 1).padStart(2, '0')}`,
    slug: `categoria-${index + 1}`,
    use_in_menu: index % 2 === 0,
  }));
  const created = [];
  for (const row of rows) created.push(await Category.create(row)); // um a um: ids em ordem crescente
  return created;
}

const names = (body) => body.data.map((item) => item.name);

beforeAll(async () => {
  await assertSafeTestDatabase(sequelize);
  await assertMigrated(sequelize);
});

beforeEach(async () => {
  await cleanDatabase(db);
});

afterAll(async () => {
  try {
    await cleanDatabase(db);
  } finally {
    await sequelize.close();
  }
});

describe('GET /v1/category/search', () => {
  it('200 com lista vazia quando não há categorias (rota pública)', async () => {
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, limit: 12, page: 1 });
  });

  it('padrão: limit 12, página 1, ordenado por id, total com todos os registros', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(15);
    expect(res.body.limit).toBe(12);
    expect(res.body.page).toBe(1);
    expect(res.body.data).toHaveLength(12);
    expect(names(res.body)[0]).toBe('Categoria 01');
    expect(names(res.body)[11]).toBe('Categoria 12');
  });

  it('página 2 com o padrão traz os 3 restantes', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?page=2');
    expect(res.body.page).toBe(2);
    expect(names(res.body)).toEqual(['Categoria 13', 'Categoria 14', 'Categoria 15']);
  });

  it('limit=5&page=3 traz os itens 11 a 15', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?limit=5&page=3');
    expect(res.body).toMatchObject({ total: 15, limit: 5, page: 3 });
    expect(names(res.body)).toEqual(['Categoria 11', 'Categoria 12', 'Categoria 13', 'Categoria 14', 'Categoria 15']);
  });

  it('página além do fim devolve lista vazia, mantendo o total', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?limit=5&page=4');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(15);
  });

  it('limit=-1 devolve todos, com limit -1 e page 1', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?limit=-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(15);
    expect(res.body).toMatchObject({ total: 15, limit: -1, page: 1 });
  });

  it('com limit=-1 o parâmetro page não tem efeito', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?limit=-1&page=3');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(15);
    expect(res.body.page).toBe(1);
  });

  it('use_in_menu=true e use_in_menu=false filtram, e o total acompanha o filtro', async () => {
    await seedCategories(15); // 8 com true (posições pares), 7 com false
    const inMenu = await request(app).get('/v1/category/search?use_in_menu=true&limit=-1');
    expect(inMenu.body.total).toBe(8);
    expect(inMenu.body.data.every((item) => item.use_in_menu === true)).toBe(true);

    const notInMenu = await request(app).get('/v1/category/search?use_in_menu=false&limit=-1');
    expect(notInMenu.body.total).toBe(7);
    expect(notInMenu.body.data.every((item) => item.use_in_menu === false)).toBe(true);
  });

  it('o filtro combina com a paginação', async () => {
    await seedCategories(15);
    const res = await request(app).get('/v1/category/search?use_in_menu=true&limit=3&page=2');
    expect(res.body).toMatchObject({ total: 8, limit: 3, page: 2 });
    expect(names(res.body)).toEqual(['Categoria 07', 'Categoria 09', 'Categoria 11']);
  });

  it('sem fields, cada item tem exatamente id, name, slug e use_in_menu (booleano)', async () => {
    await seedCategories(2);
    const res = await request(app).get('/v1/category/search');
    res.body.data.forEach((item) => {
      expect(Object.keys(item)).toEqual(['id', 'name', 'slug', 'use_in_menu']);
      expect(typeof item.use_in_menu).toBe('boolean');
    });
  });

  it('fields devolve exatamente os campos pedidos (sem id automático)', async () => {
    await seedCategories(3);
    const res = await request(app).get('/v1/category/search?fields=name,slug');
    expect(res.status).toBe(200);
    res.body.data.forEach((item) => expect(Object.keys(item).sort()).toEqual(['name', 'slug']));
    expect(names(res.body)).toEqual(['Categoria 01', 'Categoria 02', 'Categoria 03']);
  });

  it('fields=slug e fields=id,name', async () => {
    await seedCategories(2);
    const slugOnly = await request(app).get('/v1/category/search?fields=slug');
    slugOnly.body.data.forEach((item) => expect(Object.keys(item)).toEqual(['slug']));
    const idName = await request(app).get('/v1/category/search?fields=id,name');
    idName.body.data.forEach((item) => expect(Object.keys(item).sort()).toEqual(['id', 'name']));
  });

  it('fields repetido não duplica a chave', async () => {
    await seedCategories(1);
    const res = await request(app).get('/v1/category/search?fields=name,name');
    expect(Object.keys(res.body.data[0])).toEqual(['name']);
  });

  it.each([
    'limit=0', 'limit=-2', 'limit=abc', 'limit=1.5', 'limit=', 'limit=1e1',
    'page=0', 'page=-1', 'page=abc', 'page=',
    'use_in_menu=maybe', 'use_in_menu=1', 'use_in_menu=',
    'fields=foo', 'fields=created_at', 'fields=', 'fields=name,',
    'foo=bar', 'limit=1&limit=2',
  ])('400 para parâmetros inválidos: ?%s', async (query) => {
    const res = await request(app).get(`/v1/category/search?${query}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe('GET /v1/category/:id', () => {
  it('200 com exatamente id, name, slug e use_in_menu, sem token', async () => {
    const [category] = await seedCategories(1);
    const res = await request(app).get(`/v1/category/${category.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: category.id, name: 'Categoria 01', slug: 'categoria-1', use_in_menu: true });
  });

  it('404 quando não existe', async () => {
    const res = await request(app).get('/v1/category/999999');
    expect(res.status).toBe(404);
  });

  it.each(['abc', '0', '-1', '1.5'])('400 para id inválido "%s"', async (id) => {
    const res = await request(app).get(`/v1/category/${id}`);
    expect(res.status).toBe(400);
  });

  it('/search não é confundida com um id', async () => {
    const res = await request(app).get('/v1/category/search');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

describe('POST /v1/category', () => {
  const payload = { name: 'Camisetas', slug: 'camisetas', use_in_menu: true };

  it('201 e devolve a categoria criada, que fica gravada', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).post('/v1/category').set('Authorization', bearer(token)).send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), name: 'Camisetas', slug: 'camisetas', use_in_menu: true });

    const stored = await Category.findByPk(res.body.id);
    expect(stored.name).toBe('Camisetas');
    expect(stored.use_in_menu).toBe(true);
  });

  it('use_in_menu tem padrão false quando não enviado', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).post('/v1/category').set('Authorization', bearer(token)).send({ name: 'Calças', slug: 'calcas' });
    expect(res.status).toBe(201);
    expect(res.body.use_in_menu).toBe(false);
  });

  it('apara espaços de name e slug', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).post('/v1/category').set('Authorization', bearer(token)).send({ name: '  Bonés ', slug: ' bones ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Bonés', slug: 'bones' });
  });

  it('401 sem token e nada é criado', async () => {
    const res = await request(app).post('/v1/category').send(payload);
    expect(res.status).toBe(401);
    expect(await Category.count()).toBe(0);
  });

  it.each(['Basic abc', 'Bearer'])('400 com cabeçalho malformado "%s"', async (header) => {
    const res = await request(app).post('/v1/category').set('Authorization', header).send(payload);
    expect(res.status).toBe(400);
    expect(await Category.count()).toBe(0);
  });

  it('401 com token inválido', async () => {
    const res = await request(app).post('/v1/category').set('Authorization', bearer('abc.def.ghi')).send(payload);
    expect(res.status).toBe(401);
  });

  it('401 quando o usuário do token foi excluído', async () => {
    const { user, token } = await createUserAndToken();
    await User.destroy({ where: { id: user.id } });
    const res = await request(app).post('/v1/category').set('Authorization', bearer(token)).send(payload);
    expect(res.status).toBe(401);
    expect(await Category.count()).toBe(0);
  });

  it.each([
    [{}],
    [{ slug: 'x' }],
    [{ name: 'x' }],
    [{ name: '', slug: 'x' }],
    [{ name: 'x', slug: '   ' }],
    [{ name: 'x', slug: 'x', use_in_menu: 'abc' }],
    [{ name: 'x', slug: 'x', use_in_menu: 5 }],
    [{ name: 'x', slug: 'x', id: 9 }],
    [{ name: 'x', slug: 'x', created_at: '2020-01-01' }],
  ])('400 para corpo inválido %j', async (body) => {
    const { token } = await createUserAndToken();
    const res = await request(app).post('/v1/category').set('Authorization', bearer(token)).send(body);
    expect(res.status).toBe(400);
    expect(await Category.count()).toBe(0);
  });

  it('400 para JSON malformado', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', bearer(token))
      .set('Content-Type', 'application/json')
      .send('{invalido');
    expect(res.status).toBe(400);
  });

  it('aceita name e slug repetidos (o README não exige unicidade)', async () => {
    const { token } = await createUserAndToken();
    const first = await request(app).post('/v1/category').set('Authorization', bearer(token)).send(payload);
    const second = await request(app).post('/v1/category').set('Authorization', bearer(token)).send(payload);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });
});

describe('PUT /v1/category/:id', () => {
  it('204 sem corpo e atualiza name, slug e use_in_menu', async () => {
    const { token } = await createUserAndToken();
    const [category] = await seedCategories(1); // use_in_menu = true
    const res = await request(app)
      .put(`/v1/category/${category.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Novo nome', slug: 'novo-slug', use_in_menu: false });
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const stored = await Category.findByPk(category.id);
    expect(stored).toMatchObject({ name: 'Novo nome', slug: 'novo-slug', use_in_menu: false });
  });

  it('sem use_in_menu no corpo, mantém o valor atual', async () => {
    const { token } = await createUserAndToken();
    const [category] = await seedCategories(1); // use_in_menu = true
    const res = await request(app)
      .put(`/v1/category/${category.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Outro nome', slug: 'outro-slug' });
    expect(res.status).toBe(204);
    const stored = await Category.findByPk(category.id);
    expect(stored.name).toBe('Outro nome');
    expect(stored.use_in_menu).toBe(true);
  });

  it('só altera a categoria indicada', async () => {
    const { token } = await createUserAndToken();
    const [first, second] = await seedCategories(2);
    await request(app).put(`/v1/category/${first.id}`).set('Authorization', bearer(token)).send({ name: 'Mudou', slug: 'mudou' });
    const untouched = await Category.findByPk(second.id);
    expect(untouched.name).toBe('Categoria 02');
  });

  it.each([
    [{ slug: 'x' }],
    [{ name: 'x' }],
    [{ name: '', slug: 'x' }],
    [{ name: 'x', slug: 'x', use_in_menu: 'abc' }],
    [{ name: 'x', slug: 'x', id: 99 }],
  ])('400 para corpo inválido %j (e nada muda)', async (body) => {
    const { token } = await createUserAndToken();
    const [category] = await seedCategories(1);
    const res = await request(app).put(`/v1/category/${category.id}`).set('Authorization', bearer(token)).send(body);
    expect(res.status).toBe(400);
    expect((await Category.findByPk(category.id)).name).toBe('Categoria 01');
  });

  it('400 para id inválido na URL', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).put('/v1/category/abc').set('Authorization', bearer(token)).send({ name: 'x', slug: 'x' });
    expect(res.status).toBe(400);
  });

  it('404 para id inexistente com corpo válido', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).put('/v1/category/999999').set('Authorization', bearer(token)).send({ name: 'x', slug: 'x' });
    expect(res.status).toBe(404);
  });

  it('id inexistente com corpo inválido dá 400 (a validação vem antes da existência)', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).put('/v1/category/999999').set('Authorization', bearer(token)).send({});
    expect(res.status).toBe(400);
  });

  it('401 sem token e 400 com cabeçalho malformado', async () => {
    const [category] = await seedCategories(1);
    const noToken = await request(app).put(`/v1/category/${category.id}`).send({ name: 'x', slug: 'x' });
    expect(noToken.status).toBe(401);
    const malformed = await request(app).put(`/v1/category/${category.id}`).set('Authorization', 'Basic abc').send({ name: 'x', slug: 'x' });
    expect(malformed.status).toBe(400);
    expect((await Category.findByPk(category.id)).name).toBe('Categoria 01');
  });
});

describe('DELETE /v1/category/:id', () => {
  it('204 sem corpo; a categoria some e o GET passa a dar 404', async () => {
    const { token } = await createUserAndToken();
    const [category] = await seedCategories(1);
    const res = await request(app).delete(`/v1/category/${category.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await Category.count()).toBe(0);
    const get = await request(app).get(`/v1/category/${category.id}`);
    expect(get.status).toBe(404);
  });

  it('404 para id inexistente e 400 para id inválido', async () => {
    const { token } = await createUserAndToken();
    const missing = await request(app).delete('/v1/category/999999').set('Authorization', bearer(token));
    expect(missing.status).toBe(404);
    const invalid = await request(app).delete('/v1/category/abc').set('Authorization', bearer(token));
    expect(invalid.status).toBe(400);
  });

  it('401 sem token e 400 com cabeçalho malformado (nada é excluído)', async () => {
    const [category] = await seedCategories(1);
    const noToken = await request(app).delete(`/v1/category/${category.id}`);
    expect(noToken.status).toBe(401);
    const malformed = await request(app).delete(`/v1/category/${category.id}`).set('Authorization', 'Basic abc');
    expect(malformed.status).toBe(400);
    expect(await Category.count()).toBe(1);
  });

  it('excluir uma categoria remove só o vínculo; o produto permanece', async () => {
    const { token } = await createUserAndToken();
    const product = await Product.create({ name: 'Tênis', slug: 'tenis', price: 100, price_with_discount: 0 });
    const [category] = await seedCategories(1);
    await product.setCategories([category]);
    expect(await ProductCategory.count()).toBe(1);

    const res = await request(app).delete(`/v1/category/${category.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(204);
    expect(await ProductCategory.count()).toBe(0);
    expect(await Product.count()).toBe(1);
  });
});

describe('fluxo completo de categorias', () => {
  it('cria -> lista -> consulta -> atualiza -> exclui', async () => {
    const { token } = await createUserAndToken();

    const created = await request(app)
      .post('/v1/category')
      .set('Authorization', bearer(token))
      .send({ name: 'Tênis', slug: 'tenis', use_in_menu: true });
    expect(created.status).toBe(201);
    const { id } = created.body;

    const list = await request(app).get('/v1/category/search?use_in_menu=true');
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].id).toBe(id);

    const one = await request(app).get(`/v1/category/${id}`);
    expect(one.body.name).toBe('Tênis');

    const put = await request(app)
      .put(`/v1/category/${id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Tênis esportivo', slug: 'tenis-esportivo' });
    expect(put.status).toBe(204);
    expect((await request(app).get(`/v1/category/${id}`)).body).toEqual({
      id,
      name: 'Tênis esportivo',
      slug: 'tenis-esportivo',
      use_in_menu: true,
    });

    const del = await request(app).delete(`/v1/category/${id}`).set('Authorization', bearer(token));
    expect(del.status).toBe(204);
    expect((await request(app).get(`/v1/category/${id}`)).status).toBe(404);
  });
});
