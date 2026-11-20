jest.mock('../../src/models', () => ({ User: { findByPk: jest.fn() } }));

const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');
const authService = require('../../src/services/auth.service');
const { requireAuth, requireSelf } = require('../../src/middleware/auth');

const SECRET = 'segredo-do-middleware';
let originalSecret;

beforeAll(() => { originalSecret = process.env.JWT_SECRET; });
afterAll(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});
beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
  User.findByPk.mockReset();
});

async function call(headers) {
  const req = { headers };
  const next = jest.fn();
  await requireAuth(req, {}, next);
  return { req, next, error: next.mock.calls[0][0] };
}

const validToken = (payload = { id: 5, email: 'maria@mail.com' }) =>
  jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '1h' });

describe('requireAuth', () => {
  it('sem cabeçalho Authorization -> 401', async () => {
    const { error } = await call({});
    expect(error.status).toBe(401);
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('cabeçalho vazio -> 401', async () => {
    expect((await call({ authorization: '' })).error.status).toBe(401);
  });

  it.each(['Basic abc', 'Bearer', 'Bearer a b', 'Token abc', 'abc'])('cabeçalho malformado "%s" -> 400', async (value) => {
    const { error } = await call({ authorization: value });
    expect(error.status).toBe(400);
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('token inválido -> 401', async () => {
    const { error } = await call({ authorization: 'Bearer abc.def.ghi' });
    expect(error.status).toBe(401);
  });

  it('token expirado -> 401', async () => {
    const expired = jwt.sign({ id: 5, email: 'a@b.com', exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, { algorithm: 'HS256' });
    const { error } = await call({ authorization: `Bearer ${expired}` });
    expect(error.status).toBe(401);
    expect(error.message).toMatch(/expirado/i);
  });

  it('token assinado com outro segredo -> 401', async () => {
    const forged = jwt.sign({ id: 5, email: 'a@b.com' }, 'outro', { algorithm: 'HS256', expiresIn: '1h' });
    expect((await call({ authorization: `Bearer ${forged}` })).error.status).toBe(401);
  });

  it('token com alg none -> 401', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: 5, email: 'a@b.com' })}.`;
    expect((await call({ authorization: `Bearer ${none}` })).error.status).toBe(401);
  });

  it('token sem id inteiro válido -> 401', async () => {
    const { error } = await call({ authorization: `Bearer ${validToken({ id: '5', email: 'a@b.com' })}` });
    expect(error.status).toBe(401);
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('usuário do token não existe mais -> 401', async () => {
    User.findByPk.mockResolvedValue(null);
    const { error } = await call({ authorization: `Bearer ${validToken()}` });
    expect(User.findByPk).toHaveBeenCalledWith(5);
    expect(error.status).toBe(401);
  });

  it('token válido e usuário existente libera e preenche req.auth', async () => {
    User.findByPk.mockResolvedValue({ id: 5, email: 'maria@mail.com' });
    const { req, next, error } = await call({ authorization: `Bearer ${validToken()}` });
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.auth).toEqual({ id: 5, email: 'maria@mail.com' });
  });

  it('aceita "bearer" em minúsculas', async () => {
    User.findByPk.mockResolvedValue({ id: 5, email: 'maria@mail.com' });
    const { error } = await call({ authorization: `bearer ${validToken()}` });
    expect(error).toBeUndefined();
  });

  it('sem JWT_SECRET o erro NÃO vira 401 (é problema de configuração)', async () => {
    const token = validToken();
    delete process.env.JWT_SECRET;
    const { error } = await call({ authorization: `Bearer ${token}` });
    expect(error.status).toBeUndefined();
    expect(error.message).toMatch(/JWT_SECRET/);
  });

  it('o token gerado pelo auth.service é aceito', async () => {
    User.findByPk.mockResolvedValue({ id: 9, email: 'x@y.com' });
    const token = authService.generateToken({ id: 9, email: 'x@y.com' });
    const { error } = await call({ authorization: `Bearer ${token}` });
    expect(error).toBeUndefined();
  });
});

describe('requireSelf', () => {
  it('libera quando o :id é do próprio usuário', () => {
    const next = jest.fn();
    requireSelf({ validated: { params: { id: 2 } }, auth: { id: 2 } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('bloqueia com 403 quando o :id é de outro usuário', () => {
    const next = jest.fn();
    requireSelf({ validated: { params: { id: 3 } }, auth: { id: 2 } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});
