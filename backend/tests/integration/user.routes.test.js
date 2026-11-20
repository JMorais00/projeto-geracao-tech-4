// Testes de integração dos endpoints /v1/user (Supertest + MySQL).
// Gravam e apagam dados SOMENTE em drip_store_test (proteção em tests/helpers/testDatabase.js).
// Rode antes: npm run db:migrate:test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste-integracao';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const db = require('../../src/models');
const authService = require('../../src/services/auth.service');
const userService = require('../../src/services/user.service');
const { assertSafeTestDatabase, assertMigrated, cleanDatabase } = require('../helpers/testDatabase');

const { sequelize, User } = db;

const PASSWORD = '123@123';
const validUser = (overrides = {}) => ({
  firstname: 'Maria',
  surname: 'Silva',
  email: 'maria@mail.com',
  password: PASSWORD,
  confirmPassword: PASSWORD,
  ...overrides,
});

async function createUser(overrides) {
  const res = await request(app).post('/v1/user').send(validUser(overrides));
  expect(res.status).toBe(201);
  return res.body;
}

async function getToken(email = 'maria@mail.com', password = PASSWORD) {
  const res = await request(app).post('/v1/user/token').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token;
}

const bearer = (token) => `Bearer ${token}`;
const storedUser = (id) => User.scope('withPassword').findByPk(id);

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

describe('POST /v1/user (cadastro)', () => {
  it('201 e devolve só os dados públicos, sem senha', async () => {
    const res = await request(app).post('/v1/user').send(validUser());
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), firstname: 'Maria', surname: 'Silva', email: 'maria@mail.com' });
    expect(res.text).not.toMatch(/password|hash|\$2[aby]\$/i);
  });

  it('não exige token (rota pública)', async () => {
    const res = await request(app).post('/v1/user').send(validUser());
    expect(res.status).toBe(201);
  });

  it('grava apenas o hash bcrypt da senha', async () => {
    const created = await createUser();
    const stored = await storedUser(created.id);
    expect(stored.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(stored.password).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, stored.password)).toBe(true);
  });

  it('normaliza o e-mail (espaços e maiúsculas)', async () => {
    const res = await request(app).post('/v1/user').send(validUser({ email: '  MARIA@Mail.com ' }));
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('maria@mail.com');
  });

  it.each(['firstname', 'surname', 'email', 'password', 'confirmPassword'])('400 sem %s', async (field) => {
    const body = validUser();
    delete body[field];
    const res = await request(app).post('/v1/user').send(body);
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toContain(field);
    expect(await User.count()).toBe(0);
  });

  it('400 quando confirmPassword é diferente', async () => {
    const res = await request(app).post('/v1/user').send(validUser({ confirmPassword: '123@124' }));
    expect(res.status).toBe(400);
  });

  it('400 para senha curta e para senha acima de 72 bytes', async () => {
    const short = await request(app).post('/v1/user').send(validUser({ password: '12345', confirmPassword: '12345' }));
    expect(short.status).toBe(400);
    const long = 'a'.repeat(73);
    const tooLong = await request(app).post('/v1/user').send(validUser({ password: long, confirmPassword: long }));
    expect(tooLong.status).toBe(400);
  });

  it('400 para e-mail duplicado (inclusive com outra caixa) e não cria outro usuário', async () => {
    await createUser();
    const same = await request(app).post('/v1/user').send(validUser());
    expect(same.status).toBe(400);
    expect(same.body.errors.map((e) => e.field)).toContain('email');
    const upper = await request(app).post('/v1/user').send(validUser({ email: 'MARIA@MAIL.COM' }));
    expect(upper.status).toBe(400);
    expect(await User.count()).toBe(1);
  });

  it('dois cadastros simultâneos com o mesmo e-mail: um 201 e um 400 (nunca 500)', async () => {
    const [a, b] = await Promise.all([
      request(app).post('/v1/user').send(validUser()),
      request(app).post('/v1/user').send(validUser()),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 400]);
    expect(await User.count()).toBe(1);
  });

  it('400 para campos desconhecidos (id, role...)', async () => {
    const withId = await request(app).post('/v1/user').send({ ...validUser(), id: 99 });
    expect(withId.status).toBe(400);
    const withRole = await request(app).post('/v1/user').send({ ...validUser(), role: 'admin' });
    expect(withRole.status).toBe(400);
    expect(await User.count()).toBe(0);
  });

  it('400 para JSON malformado', async () => {
    const res = await request(app).post('/v1/user').set('Content-Type', 'application/json').send('{invalido');
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/user/token (login)', () => {
  it('200 e devolve somente { token }, válido para o usuário', async () => {
    const created = await createUser();
    const res = await request(app).post('/v1/user/token').send({ email: 'maria@mail.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['token']);
    const payload = authService.verifyToken(res.body.token);
    expect(payload).toMatchObject({ id: created.id, email: 'maria@mail.com' });
    expect(res.text).not.toMatch(/password|\$2[aby]\$/i);
  });

  it('aceita o e-mail com outra caixa', async () => {
    await createUser();
    const res = await request(app).post('/v1/user/token').send({ email: 'MARIA@mail.com', password: PASSWORD });
    expect(res.status).toBe(200);
  });

  it('400 para senha errada e para e-mail inexistente, com a mesma mensagem', async () => {
    await createUser();
    const wrongPassword = await request(app).post('/v1/user/token').send({ email: 'maria@mail.com', password: 'errada123' });
    const unknownEmail = await request(app).post('/v1/user/token').send({ email: 'ninguem@mail.com', password: PASSWORD });
    expect(wrongPassword.status).toBe(400);
    expect(unknownEmail.status).toBe(400);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('400 para dados incompletos, e-mail inválido ou campos extras', async () => {
    const noPassword = await request(app).post('/v1/user/token').send({ email: 'maria@mail.com' });
    expect(noPassword.status).toBe(400);
    const noEmail = await request(app).post('/v1/user/token').send({ password: PASSWORD });
    expect(noEmail.status).toBe(400);
    const badEmail = await request(app).post('/v1/user/token').send({ email: 'abc', password: PASSWORD });
    expect(badEmail.status).toBe(400);
    const extra = await request(app).post('/v1/user/token').send({ email: 'maria@mail.com', password: PASSWORD, admin: true });
    expect(extra.status).toBe(400);
  });
});

describe('GET /v1/user/:id', () => {
  it('200 com id, firstname, surname e email, sem exigir token e sem senha', async () => {
    const created = await createUser();
    const res = await request(app).get(`/v1/user/${created.id}`);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['email', 'firstname', 'id', 'surname']);
    expect(res.body).toEqual(created);
    expect(res.text).not.toMatch(/password|\$2[aby]\$/i);
  });

  it('404 quando o usuário não existe', async () => {
    const res = await request(app).get('/v1/user/999999');
    expect(res.status).toBe(404);
  });

  it.each(['abc', '0', '-1', '1.5'])('400 para id inválido "%s"', async (id) => {
    const res = await request(app).get(`/v1/user/${id}`);
    expect(res.status).toBe(400);
  });
});

describe('PUT /v1/user/:id', () => {
  const update = { firstname: 'Ana', surname: 'Souza', email: 'Ana@Mail.com' };

  it('204 sem corpo e atualiza só nome, sobrenome e e-mail (senha intacta)', async () => {
    const created = await createUser();
    const token = await getToken();
    const before = await storedUser(created.id);

    const res = await request(app).put(`/v1/user/${created.id}`).set('Authorization', bearer(token)).send(update);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const after = await storedUser(created.id);
    expect(after.firstname).toBe('Ana');
    expect(after.surname).toBe('Souza');
    expect(after.email).toBe('ana@mail.com');
    expect(after.password).toBe(before.password);
  });

  it('204 ao reenviar o próprio e-mail', async () => {
    const created = await createUser();
    const token = await getToken();
    const res = await request(app)
      .put(`/v1/user/${created.id}`)
      .set('Authorization', bearer(token))
      .send({ firstname: 'Maria', surname: 'Silva', email: 'maria@mail.com' });
    expect(res.status).toBe(204);
  });

  it('400 quando o e-mail já pertence a outro usuário (e nada muda)', async () => {
    const first = await createUser();
    await createUser({ email: 'joao@mail.com' });
    const token = await getToken();
    const res = await request(app)
      .put(`/v1/user/${first.id}`)
      .set('Authorization', bearer(token))
      .send({ firstname: 'Maria', surname: 'Silva', email: 'joao@mail.com' });
    expect(res.status).toBe(400);
    expect((await storedUser(first.id)).email).toBe('maria@mail.com');
  });

  it.each(['firstname', 'surname', 'email'])('400 sem %s', async (field) => {
    const created = await createUser();
    const token = await getToken();
    const body = { firstname: 'Ana', surname: 'Souza', email: 'ana@mail.com' };
    delete body[field];
    const res = await request(app).put(`/v1/user/${created.id}`).set('Authorization', bearer(token)).send(body);
    expect(res.status).toBe(400);
  });

  it.each(['password', 'confirmPassword', 'id', 'created_at'])('400 com %s no corpo e a senha não muda', async (field) => {
    const created = await createUser();
    const token = await getToken();
    const before = await storedUser(created.id);
    const res = await request(app)
      .put(`/v1/user/${created.id}`)
      .set('Authorization', bearer(token))
      .send({ ...update, [field]: 'novaSenha123' });
    expect(res.status).toBe(400);
    const after = await storedUser(created.id);
    expect(after.password).toBe(before.password);
    expect(after.firstname).toBe('Maria');
  });

  it('401 sem cabeçalho Authorization', async () => {
    const created = await createUser();
    const res = await request(app).put(`/v1/user/${created.id}`).send(update);
    expect(res.status).toBe(401);
  });

  it.each(['Basic abc', 'Bearer'])('400 com cabeçalho malformado "%s"', async (header) => {
    const created = await createUser();
    const res = await request(app).put(`/v1/user/${created.id}`).set('Authorization', header).send(update);
    expect(res.status).toBe(400);
  });

  it('401 com token inválido, expirado ou assinado com outro segredo', async () => {
    const created = await createUser();
    const expired = jwt.sign(
      { id: created.id, email: created.email, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' },
    );
    const forged = jwt.sign({ id: created.id, email: created.email }, 'outro-segredo', { algorithm: 'HS256', expiresIn: '1h' });

    for (const token of ['abc.def.ghi', expired, forged]) {
      const res = await request(app).put(`/v1/user/${created.id}`).set('Authorization', bearer(token)).send(update);
      expect(res.status).toBe(401);
    }
  });

  it('403 ao tentar alterar outro usuário (e os dados dele não mudam)', async () => {
    await createUser();
    const other = await createUser({ email: 'joao@mail.com', firstname: 'Joao' });
    const token = await getToken();
    const res = await request(app).put(`/v1/user/${other.id}`).set('Authorization', bearer(token)).send(update);
    expect(res.status).toBe(403);
    expect((await storedUser(other.id)).firstname).toBe('Joao');
  });

  it('403 (e não 404) para um id inexistente de outra pessoa', async () => {
    await createUser();
    const token = await getToken();
    const res = await request(app).put('/v1/user/999999').set('Authorization', bearer(token)).send(update);
    expect(res.status).toBe(403);
  });

  it('a verificação de dono vem antes da validação do corpo (403 com corpo inválido)', async () => {
    await createUser();
    const other = await createUser({ email: 'joao@mail.com' });
    const token = await getToken();
    const res = await request(app).put(`/v1/user/${other.id}`).set('Authorization', bearer(token)).send({});
    expect(res.status).toBe(403);
  });

  it('400 para id inválido na URL', async () => {
    await createUser();
    const token = await getToken();
    const res = await request(app).put('/v1/user/abc').set('Authorization', bearer(token)).send(update);
    expect(res.status).toBe(400);
  });

  it('401 quando o usuário do token foi excluído', async () => {
    const created = await createUser();
    const token = await getToken();
    await User.destroy({ where: { id: created.id } });
    const res = await request(app).put(`/v1/user/${created.id}`).set('Authorization', bearer(token)).send(update);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /v1/user/:id', () => {
  it('204, remove o usuário e o GET passa a dar 404', async () => {
    const created = await createUser();
    const token = await getToken();
    const res = await request(app).delete(`/v1/user/${created.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await User.count()).toBe(0);
    const get = await request(app).get(`/v1/user/${created.id}`);
    expect(get.status).toBe(404);
  });

  it('o token de um usuário excluído deixa de funcionar (401)', async () => {
    const created = await createUser();
    const token = await getToken();
    await request(app).delete(`/v1/user/${created.id}`).set('Authorization', bearer(token));
    const res = await request(app)
      .put(`/v1/user/${created.id}`)
      .set('Authorization', bearer(token))
      .send({ firstname: 'A', surname: 'B', email: 'a@b.com' });
    expect(res.status).toBe(401);
  });

  it('401 sem token e 400 com cabeçalho malformado', async () => {
    const created = await createUser();
    const noToken = await request(app).delete(`/v1/user/${created.id}`);
    expect(noToken.status).toBe(401);
    const malformed = await request(app).delete(`/v1/user/${created.id}`).set('Authorization', 'Basic abc');
    expect(malformed.status).toBe(400);
    expect(await User.count()).toBe(1);
  });

  it('403 ao tentar excluir outro usuário (que continua existindo)', async () => {
    await createUser();
    const other = await createUser({ email: 'joao@mail.com' });
    const token = await getToken();
    const res = await request(app).delete(`/v1/user/${other.id}`).set('Authorization', bearer(token));
    expect(res.status).toBe(403);
    expect(await User.count()).toBe(2);
  });

  it('403 para um id inexistente e 400 para id inválido', async () => {
    await createUser();
    const token = await getToken();
    const missing = await request(app).delete('/v1/user/999999').set('Authorization', bearer(token));
    expect(missing.status).toBe(403);
    const invalid = await request(app).delete('/v1/user/abc').set('Authorization', bearer(token));
    expect(invalid.status).toBe(400);
  });
});

describe('user.service: 404 para ids inexistentes', () => {
  // Pelo HTTP, quem está autenticado e pede outro id recebe 403; o 404 do service
  // cobre o caso de o usuário sumir entre a autenticação e a operação.
  it('getById, update e remove rejeitam com status 404', async () => {
    await expect(userService.getById(999999)).rejects.toMatchObject({ status: 404 });
    await expect(
      userService.update(999999, { firstname: 'A', surname: 'B', email: 'a@b.com' }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(userService.remove(999999)).rejects.toMatchObject({ status: 404 });
  });
});

describe('fluxo completo', () => {
  it('cadastro -> token -> atualização -> exclusão', async () => {
    const created = await createUser();
    const token = await getToken();

    const put = await request(app)
      .put(`/v1/user/${created.id}`)
      .set('Authorization', bearer(token))
      .send({ firstname: 'Maria', surname: 'Souza', email: 'maria@mail.com' });
    expect(put.status).toBe(204);

    const get = await request(app).get(`/v1/user/${created.id}`);
    expect(get.body.surname).toBe('Souza');

    const del = await request(app).delete(`/v1/user/${created.id}`).set('Authorization', bearer(token));
    expect(del.status).toBe(204);
  });
});
