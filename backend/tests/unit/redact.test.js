const { redactSecrets } = require('../../src/utils/redact');

const HASH = `$2b$10$${'a'.repeat(53)}`;

describe('redactSecrets', () => {
  it('remove hashes do bcrypt', () => {
    const result = redactSecrets(`INSERT ... VALUES ('${HASH}')`);
    expect(result).not.toContain(HASH);
    expect(result).not.toContain('$2b$');
    expect(result).toContain('[hash-removido]');
  });

  it('remove campos password e confirmPassword em JSON', () => {
    const result = redactSecrets('{"email":"a@b.com","password":"123@123","confirmPassword":"123@123"}');
    expect(result).not.toContain('123@123');
    expect(result).toContain('a@b.com');
  });

  it('não altera textos sem segredos e aceita valores que não são texto', () => {
    expect(redactSecrets('mensagem normal')).toBe('mensagem normal');
    expect(redactSecrets(undefined)).toBe('undefined');
    expect(redactSecrets({ a: 1 })).toBe('[object Object]');
  });
});
