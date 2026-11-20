const { validate } = require('../../src/middleware/validate');
const {
  registerSchema,
  updateSchema,
  loginSchema,
  idParamSchema,
} = require('../../src/validators/user.validator');

function run(schemas, request = {}) {
  const req = { body: {}, params: {}, ...request };
  let error;
  validate(schemas)(req, {}, (err) => { error = err; });
  return { error, validated: req.validated };
}

const fieldsOf = (error) => error.errors.map((item) => item.field);

const validRegister = () => ({
  firstname: 'Maria',
  surname: 'Silva',
  email: 'maria@mail.com',
  password: '123@123',
  confirmPassword: '123@123',
});

describe('registerSchema (POST /v1/user)', () => {
  it('aceita dados válidos', () => {
    const { error, validated } = run({ body: registerSchema }, { body: validRegister() });
    expect(error).toBeUndefined();
    expect(validated.body.email).toBe('maria@mail.com');
  });

  it('apara espaços de nomes e e-mail e coloca o e-mail em minúsculas', () => {
    const { validated } = run(
      { body: registerSchema },
      { body: { ...validRegister(), firstname: '  Maria ', email: '  MARIA@Mail.COM ' } },
    );
    expect(validated.body.firstname).toBe('Maria');
    expect(validated.body.email).toBe('maria@mail.com');
  });

  it.each(['firstname', 'surname', 'email', 'password', 'confirmPassword'])('exige %s', (field) => {
    const body = validRegister();
    delete body[field];
    const { error } = run({ body: registerSchema }, { body });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain(field);
  });

  it('rejeita textos vazios ou só com espaços nos nomes', () => {
    expect(run({ body: registerSchema }, { body: { ...validRegister(), firstname: '' } }).error.status).toBe(400);
    expect(run({ body: registerSchema }, { body: { ...validRegister(), surname: '   ' } }).error.status).toBe(400);
  });

  it.each(['abc', 'a@', '@b.com', 'a b@c.com', 'user@'])('rejeita e-mail inválido: %s', (email) => {
    const { error } = run({ body: registerSchema }, { body: { ...validRegister(), email } });
    expect(fieldsOf(error)).toContain('email');
  });

  it('senha: mínimo de 6 caracteres', () => {
    const tooShort = run({ body: registerSchema }, { body: { ...validRegister(), password: '12345', confirmPassword: '12345' } });
    expect(fieldsOf(tooShort.error)).toContain('password');
    const ok = run({ body: registerSchema }, { body: { ...validRegister(), password: '123456', confirmPassword: '123456' } });
    expect(ok.error).toBeUndefined();
  });

  it('senha: máximo de 72 bytes (e não de caracteres)', () => {
    const at = (password) => run({ body: registerSchema }, { body: { ...validRegister(), password, confirmPassword: password } });
    expect(at('a'.repeat(72)).error).toBeUndefined();
    expect(fieldsOf(at('a'.repeat(73)).error)).toContain('password');
    expect(at('é'.repeat(36)).error).toBeUndefined(); // 72 bytes
    expect(fieldsOf(at('é'.repeat(37)).error)).toContain('password'); // 74 bytes
  });

  it('senha: não apara espaços', () => {
    const { error, validated } = run(
      { body: registerSchema },
      { body: { ...validRegister(), password: '  ab12  ', confirmPassword: '  ab12  ' } },
    );
    expect(error).toBeUndefined();
    expect(validated.body.password).toBe('  ab12  ');
  });

  it('exige confirmPassword igual a password', () => {
    const { error } = run({ body: registerSchema }, { body: { ...validRegister(), confirmPassword: '123@124' } });
    expect(fieldsOf(error)).toContain('confirmPassword');
  });

  it.each(['id', 'admin', 'role', 'created_at'])('rejeita campo desconhecido: %s', (field) => {
    const { error } = run({ body: registerSchema }, { body: { ...validRegister(), [field]: 'x' } });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain(field);
    expect(error.errors.find((item) => item.field === field).message).toMatch(/não é um campo permitido/);
  });

  it('rejeita corpo que não é um objeto', () => {
    expect(run({ body: registerSchema }, { body: [] }).error.status).toBe(400);
    expect(run({ body: registerSchema }, { body: 'texto' }).error.status).toBe(400);
  });

  it('as mensagens de erro nunca incluem a senha enviada', () => {
    const { error } = run({ body: registerSchema }, { body: { ...validRegister(), password: '9x9x9', confirmPassword: '8y8y8' } });
    const text = JSON.stringify({ message: error.message, errors: error.errors });
    expect(text).not.toContain('9x9x9');
    expect(text).not.toContain('8y8y8');
  });
});

describe('updateSchema (PUT /v1/user/:id)', () => {
  const validUpdate = () => ({ firstname: 'Ana', surname: 'Souza', email: 'Ana@Mail.com' });

  it('aceita nome, sobrenome e e-mail e normaliza o e-mail', () => {
    const { error, validated } = run({ body: updateSchema }, { body: validUpdate() });
    expect(error).toBeUndefined();
    expect(validated.body).toEqual({ firstname: 'Ana', surname: 'Souza', email: 'ana@mail.com' });
  });

  it.each(['firstname', 'surname', 'email'])('exige %s', (field) => {
    const body = validUpdate();
    delete body[field];
    expect(fieldsOf(run({ body: updateSchema }, { body }).error)).toContain(field);
  });

  it.each(['password', 'confirmPassword', 'id', 'created_at'])('rejeita %s no corpo (não pode ser alterado)', (field) => {
    const { error } = run({ body: updateSchema }, { body: { ...validUpdate(), [field]: 'x' } });
    expect(fieldsOf(error)).toContain(field);
  });
});

describe('loginSchema (POST /v1/user/token)', () => {
  it('aceita e-mail e senha', () => {
    const { error, validated } = run({ body: loginSchema }, { body: { email: ' MARIA@mail.com ', password: '123@123' } });
    expect(error).toBeUndefined();
    expect(validated.body).toEqual({ email: 'maria@mail.com', password: '123@123' });
  });

  it('rejeita campos ausentes, senha que não é texto, e-mail inválido e campos extras', () => {
    expect(run({ body: loginSchema }, { body: { email: 'maria@mail.com' } }).error.status).toBe(400);
    expect(run({ body: loginSchema }, { body: { password: '123@123' } }).error.status).toBe(400);
    expect(run({ body: loginSchema }, { body: { email: 'maria@mail.com', password: 123456 } }).error.status).toBe(400);
    expect(run({ body: loginSchema }, { body: { email: 'abc', password: '123@123' } }).error.status).toBe(400);
    expect(run({ body: loginSchema }, { body: { email: 'maria@mail.com', password: '123@123', admin: true } }).error.status).toBe(400);
  });
});

describe('idParamSchema (:id)', () => {
  it.each([['1', 1], ['42', 42], ['2147483647', 2147483647]])('converte %s para número', (text, number) => {
    const { error, validated } = run({ params: idParamSchema }, { params: { id: text } });
    expect(error).toBeUndefined();
    expect(validated.params.id).toBe(number);
  });

  it.each(['0', '-1', 'abc', '1e3', '01', '1.5', ' 1', '', '2147483648', '99999999999'])('rejeita id inválido: "%s"', (text) => {
    const { error } = run({ params: idParamSchema }, { params: { id: text } });
    expect(error.status).toBe(400);
  });
});
