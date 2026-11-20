const { errorHandler } = require('../../src/middleware/errorHandler');
const { badRequest, unauthorized, forbidden, notFound } = require('../../src/utils/AppError');

function fakeRes() {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const handle = (err, res = fakeRes()) => {
  const next = jest.fn();
  errorHandler(err, {}, res, next);
  return { res, next };
};

describe('errorHandler', () => {
  it.each([
    [badRequest('x'), 400],
    [unauthorized('x'), 401],
    [forbidden('x'), 403],
    [notFound('x'), 404],
  ])('AppError usa o próprio status (%#)', (err, status) => {
    const { res } = handle(err);
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ message: 'x' });
  });

  it('inclui "errors" só quando existem', () => {
    const errors = [{ field: 'email', message: 'E-mail já cadastrado' }];
    const { res } = handle(badRequest('Dados inválidos', errors));
    expect(res.json).toHaveBeenCalledWith({ message: 'Dados inválidos', errors });
  });

  it('JSON malformado -> 400', () => {
    const { res } = handle(Object.assign(new Error('x'), { type: 'entity.parse.failed' }));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'JSON inválido no corpo da requisição' });
  });

  it.each(['SequelizeUniqueConstraintError', 'SequelizeValidationError', 'SequelizeForeignKeyConstraintError'])(
    '%s -> 400 sem expor SQL nem valores',
    (name) => {
      const err = Object.assign(new Error('Duplicate entry'), {
        name,
        errors: [{ path: 'email', message: 'contém valor secreto', value: '$2b$10$segredo' }],
        sql: "INSERT INTO users VALUES ('$2b$10$segredo')",
      });
      const { res } = handle(err);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('segredo');
      expect(body).not.toContain('INSERT');
    },
  );

  it('erro inesperado -> 500 genérico, sem detalhes', () => {
    const err = Object.assign(new Error('falha interna'), { sql: 'SELECT 1', original: { code: 'X' } });
    const { res } = handle(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor' });
  });

  it('o log de erro inesperado não contém hashes de senha', () => {
    const hash = `$2b$10$${'b'.repeat(53)}`;
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      handle(new Error(`falha perto de ${hash}`));
      const logged = spy.mock.calls.map((args) => args.join(' ')).join('\n');
      expect(logged).not.toContain(hash);
      expect(logged).toContain('[hash-removido]');
    } finally {
      spy.mockRestore();
      process.env.NODE_ENV = original;
    }
  });

  it('se a resposta já começou, repassa o erro', () => {
    const res = fakeRes();
    res.headersSent = true;
    const err = new Error('x');
    const { next } = handle(err, res);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});
