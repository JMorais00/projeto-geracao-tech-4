const { validate } = require('../../src/middleware/validate');
const { searchQuerySchema, createSchema, updateSchema } = require('../../src/validators/category.validator');
const { idParamSchema } = require('../../src/validators/common.validator');
const userValidator = require('../../src/validators/user.validator');

function run(schemas, request = {}) {
  const req = { body: {}, params: {}, query: {}, ...request };
  let error;
  validate(schemas)(req, {}, (err) => { error = err; });
  return { error, validated: req.validated };
}

const fieldsOf = (error) => error.errors.map((item) => item.field);
const search = (query) => run({ query: searchQuerySchema }, { query });

describe('idParamSchema compartilhado', () => {
  it('user.validator reexporta exatamente o mesmo esquema', () => {
    expect(userValidator.idParamSchema).toBe(idParamSchema);
  });

  it('continua convertendo e validando o id', () => {
    expect(run({ params: idParamSchema }, { params: { id: '12' } }).validated.params.id).toBe(12);
    expect(run({ params: idParamSchema }, { params: { id: 'abc' } }).error.status).toBe(400);
  });
});

describe('validate() com query', () => {
  it('grava a query validada em req.validated.query', () => {
    const { error, validated } = search({});
    expect(error).toBeUndefined();
    expect(validated.query).toEqual({ limit: 12, page: 1 });
  });

  it('valida query, params e body na mesma chamada', () => {
    const { validated } = run(
      { params: idParamSchema, query: searchQuerySchema, body: createSchema },
      { params: { id: '3' }, query: { limit: '5' }, body: { name: 'A', slug: 'a' } },
    );
    expect(validated.params.id).toBe(3);
    expect(validated.query.limit).toBe(5);
    expect(validated.body.name).toBe('A');
  });
});

describe('searchQuerySchema (GET /v1/category/search)', () => {
  it('aplica os padrões limit=12 e page=1 e não filtra nem limita campos', () => {
    const { validated } = search({});
    expect(validated.query).toEqual({ limit: 12, page: 1 });
    expect(validated.query.use_in_menu).toBeUndefined();
    expect(validated.query.fields).toBeUndefined();
  });

  it('converte limit, page, use_in_menu e fields', () => {
    const { error, validated } = search({ limit: '5', page: '3', use_in_menu: 'true', fields: 'name,slug' });
    expect(error).toBeUndefined();
    expect(validated.query).toEqual({ limit: 5, page: 3, use_in_menu: true, fields: ['name', 'slug'] });
  });

  it('aceita limit=-1 e use_in_menu=false', () => {
    const { error, validated } = search({ limit: '-1', use_in_menu: 'false' });
    expect(error).toBeUndefined();
    expect(validated.query.limit).toBe(-1);
    expect(validated.query.use_in_menu).toBe(false);
  });

  it('remove repetições em fields e apara espaços', () => {
    expect(search({ fields: 'name,name, slug' }).validated.query.fields).toEqual(['name', 'slug']);
  });

  it.each(['id', 'name', 'slug', 'use_in_menu'])('aceita fields=%s', (field) => {
    expect(search({ fields: field }).error).toBeUndefined();
  });

  it.each(['0', '-2', 'abc', '1.5', '', '1e1', ' 5', '-0', '1234567890'])('rejeita limit inválido "%s"', (limit) => {
    const { error } = search({ limit });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('limit');
  });

  it.each(['0', '-1', 'abc', '1.5', '', '1e1', ' 2'])('rejeita page inválido "%s"', (page) => {
    const { error } = search({ page });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('page');
  });

  it.each(['maybe', '1', '0', 'sim', ''])('rejeita use_in_menu inválido "%s"', (value) => {
    const { error } = search({ use_in_menu: value });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('use_in_menu');
  });

  it.each(['foo', 'created_at', 'updated_at', 'name,', ',name', 'name,foo', ''])('rejeita fields inválido "%s"', (fields) => {
    const { error } = search({ fields });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('fields');
  });

  it('rejeita parâmetros desconhecidos', () => {
    const { error } = search({ foo: 'bar' });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('foo');
    expect(error.errors[0].message).toMatch(/não é um campo permitido/);
  });

  it('rejeita parâmetros repetidos (que chegam como lista) e formas com colchetes', () => {
    expect(search({ limit: ['1', '2'] }).error.status).toBe(400);
    expect(search({ fields: ['name', 'slug'] }).error.status).toBe(400);
    expect(search({ fields: { a: 'b' } }).error.status).toBe(400);
  });
});

describe.each([['createSchema', createSchema], ['updateSchema', updateSchema]])('%s (corpo de POST e PUT)', (label, schema) => {
  const body = (extra = {}) => ({ name: 'Camisetas', slug: 'camisetas', ...extra });

  it('aceita name e slug e deixa use_in_menu indefinido quando não enviado', () => {
    const { error, validated } = run({ body: schema }, { body: body() });
    expect(error).toBeUndefined();
    expect(validated.body).toEqual({ name: 'Camisetas', slug: 'camisetas' });
  });

  it('aceita use_in_menu booleano (e "true"/"false" como texto)', () => {
    expect(run({ body: schema }, { body: body({ use_in_menu: true }) }).validated.body.use_in_menu).toBe(true);
    expect(run({ body: schema }, { body: body({ use_in_menu: false }) }).validated.body.use_in_menu).toBe(false);
    expect(run({ body: schema }, { body: body({ use_in_menu: 'true' }) }).validated.body.use_in_menu).toBe(true);
  });

  it('apara espaços de name e slug', () => {
    const { validated } = run({ body: schema }, { body: { name: '  Tênis ', slug: ' tenis ' } });
    expect(validated.body).toEqual({ name: 'Tênis', slug: 'tenis' });
  });

  it.each(['name', 'slug'])('exige %s', (field) => {
    const data = body();
    delete data[field];
    const { error } = run({ body: schema }, { body: data });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain(field);
  });

  it('rejeita textos vazios ou só com espaços e textos acima de 255 caracteres', () => {
    expect(run({ body: schema }, { body: body({ name: '' }) }).error.status).toBe(400);
    expect(run({ body: schema }, { body: body({ slug: '   ' }) }).error.status).toBe(400);
    expect(run({ body: schema }, { body: body({ name: 'a'.repeat(256) }) }).error.status).toBe(400);
  });

  it.each(['abc', 5, 1, null, []])('rejeita use_in_menu inválido: %p', (value) => {
    const { error } = run({ body: schema }, { body: body({ use_in_menu: value }) });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain('use_in_menu');
  });

  it.each(['id', 'created_at', 'updated_at', 'foo'])('rejeita campo desconhecido: %s', (field) => {
    const { error } = run({ body: schema }, { body: body({ [field]: 'x' }) });
    expect(error.status).toBe(400);
    expect(fieldsOf(error)).toContain(field);
  });

  it('rejeita corpo que não é objeto', () => {
    expect(run({ body: schema }, { body: [] }).error.status).toBe(400);
  });

  it('não rejeita nome ou slug repetidos (sem regra de unicidade)', () => {
    expect(run({ body: schema }, { body: body() }).error).toBeUndefined();
  });
});
