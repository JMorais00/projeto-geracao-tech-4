const { createSchema, updateSchema, searchSchema } = require('../../src/validators/product.validator');

const baseProduct = {
  name: 'Tênis de corrida',
  slug: 'tenis-de-corrida',
  price: 199.9,
  price_with_discount: 159.9,
  category_ids: [1, 2],
};

describe('product validator', () => {
  it('aplica os padrões de produto e normaliza radius e o alias value', () => {
    const { error, value } = createSchema.validate({
      ...baseProduct,
      options: [{ title: 'Tamanho', radius: '4px', value: ['PP', 'GG'] }],
    });
    expect(error).toBeUndefined();
    expect(value.enabled).toBe(false);
    expect(value.use_in_menu).toBe(false);
    expect(value.stock).toBe(0);
    expect(value.options[0]).toMatchObject({ radius: 4, values: ['PP', 'GG'] });
    expect(value.options[0].value).toBeUndefined();
    expect(value.images).toEqual([]);
  });

  it('rejeita campos extras, categorias repetidas e valores de opção com vírgula', () => {
    expect(createSchema.validate({ ...baseProduct, unexpected: true }).error).toBeDefined();
    expect(createSchema.validate({ ...baseProduct, category_ids: [1, 1] }).error).toBeDefined();
    expect(createSchema.validate({ ...baseProduct, options: [{ title: 'Tamanho', values: ['P, M'] }] }).error).toBeDefined();
  });

  it('aceita atualização parcial e exige ao menos um campo', () => {
    expect(updateSchema.validate({ stock: 10 }).error).toBeUndefined();
    expect(updateSchema.validate({}).error).toBeDefined();
    expect(updateSchema.validate({ not_allowed: true }).error).toBeDefined();
  });

  it('valida parâmetros de busca e converte os filtros', () => {
    const { error, value } = searchSchema.validate({
      limit: '30', page: '2', fields: 'name,images,price',
      category_ids: '15,24', 'price-range': '100-200', option: { 45: 'GG,PP' },
    });
    expect(error).toBeUndefined();
    expect(value).toMatchObject({ limit: 30, page: 2, fields: ['name', 'images', 'price'], category_ids: [15, 24], 'price-range': [100, 200] });
    expect(value.option).toEqual({ 45: 'GG,PP' });
  });

  it.each([
    { limit: '0' }, { page: '-1' }, { fields: 'password' }, { category_ids: '1,abc' },
    { 'price-range': '200-100' }, { 'price-range': 'min-max' }, { option: { abc: 'GG' } },
    { extra: 'not-allowed' },
  ])('rejeita filtro inválido: %j', (query) => {
    expect(searchSchema.validate(query).error).toBeDefined();
  });
});
