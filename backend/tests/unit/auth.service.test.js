const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authService = require('../../src/services/auth.service');
const { getBcryptRounds } = require('../../src/config/auth');

const SECRET = 'segredo-unitario-de-teste';
const user = { id: 7, email: 'maria@mail.com' };

const saved = {};
const ENV_KEYS = ['JWT_SECRET', 'JWT_EXPIRES_IN', 'BCRYPT_ROUNDS', 'NODE_ENV'];

beforeAll(() => {
  ENV_KEYS.forEach((key) => { saved[key] = process.env[key]; });
});

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
  delete process.env.JWT_EXPIRES_IN;
  delete process.env.BCRYPT_ROUNDS;
});

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  });
});

const base64url = (object) => Buffer.from(JSON.stringify(object)).toString('base64url');

describe('hash de senha (bcrypt)', () => {
  it('gera um hash bcrypt diferente da senha e que confere com ela', async () => {
    const hash = await authService.hashPassword('123@123');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toBe('123@123');
    expect(await authService.comparePassword('123@123', hash)).toBe(true);
    expect(await authService.comparePassword('outra-senha', hash)).toBe(false);
  });

  it('a mesma senha gera hashes diferentes (salt)', async () => {
    const first = await authService.hashPassword('123@123');
    const second = await authService.hashPassword('123@123');
    expect(first).not.toBe(second);
  });

  it('usa o custo configurado', async () => {
    process.env.BCRYPT_ROUNDS = '5';
    const hash = await authService.hashPassword('123@123');
    expect(bcrypt.getRounds(hash)).toBe(5);
  });
});

describe('getBcryptRounds', () => {
  it('usa 4 nos testes e 10 fora deles', () => {
    process.env.NODE_ENV = 'test';
    expect(getBcryptRounds()).toBe(4);
    process.env.NODE_ENV = 'production';
    expect(getBcryptRounds()).toBe(10);
  });

  it('respeita BCRYPT_ROUNDS válido e ignora inválido', () => {
    process.env.NODE_ENV = 'test';
    process.env.BCRYPT_ROUNDS = '6';
    expect(getBcryptRounds()).toBe(6);
    ['abc', '3', '99', '5.5', ''].forEach((invalid) => {
      process.env.BCRYPT_ROUNDS = invalid;
      expect(getBcryptRounds()).toBe(4);
    });
  });
});

describe('token JWT', () => {
  it('gera token HS256 com id, e-mail e expiração, sem senha', () => {
    const token = authService.generateToken(user);
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(Object.keys(decoded.payload).sort()).toEqual(['email', 'exp', 'iat', 'id']);
    expect(decoded.payload).toMatchObject({ id: 7, email: 'maria@mail.com' });
  });

  it('expira em 1h por padrão e respeita JWT_EXPIRES_IN', () => {
    const defaultToken = jwt.decode(authService.generateToken(user));
    expect(defaultToken.exp - defaultToken.iat).toBe(3600);

    process.env.JWT_EXPIRES_IN = '2h';
    const custom = jwt.decode(authService.generateToken(user));
    expect(custom.exp - custom.iat).toBe(7200);
  });

  it('verifica um token válido', () => {
    const payload = authService.verifyToken(authService.generateToken(user));
    expect(payload).toMatchObject({ id: 7, email: 'maria@mail.com' });
  });

  it('rejeita token expirado', () => {
    const expired = jwt.sign({ ...user, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, { algorithm: 'HS256' });
    expect(() => authService.verifyToken(expired)).toThrow(expect.objectContaining({ name: 'TokenExpiredError' }));
  });

  it('rejeita token assinado com outro segredo', () => {
    const forged = jwt.sign(user, 'outro-segredo', { algorithm: 'HS256', expiresIn: '1h' });
    expect(() => authService.verifyToken(forged)).toThrow(expect.objectContaining({ name: 'JsonWebTokenError' }));
  });

  it('rejeita token adulterado', () => {
    const [header, , signature] = authService.generateToken(user).split('.');
    const tampered = `${header}.${base64url({ id: 1, email: 'x@x.com' })}.${signature}`;
    expect(() => authService.verifyToken(tampered)).toThrow(expect.objectContaining({ name: 'JsonWebTokenError' }));
  });

  it('rejeita token com alg none', () => {
    const none = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ ...user })}.`;
    expect(() => authService.verifyToken(none)).toThrow(expect.objectContaining({ name: 'JsonWebTokenError' }));
  });

  it('rejeita texto que não é token', () => {
    expect(() => authService.verifyToken('abc')).toThrow(expect.objectContaining({ name: 'JsonWebTokenError' }));
  });

  it('sem JWT_SECRET gera erro claro (não é erro de token)', () => {
    delete process.env.JWT_SECRET;
    expect(() => authService.generateToken(user)).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = '   ';
    expect(() => authService.generateToken(user)).toThrow(/JWT_SECRET/);
  });
});
