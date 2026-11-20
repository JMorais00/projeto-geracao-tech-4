// Testes dos models. Criam e apagam dados SOMENTE no banco drip_store_test
// (a proteção em tests/helpers/testDatabase.js aborta se for outro banco).
// Rode antes: npm run db:migrate:test
const { QueryTypes } = require('sequelize');
const db = require('../../src/models');
const { assertSafeTestDatabase, assertMigrated, cleanDatabase } = require('../helpers/testDatabase');

const { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory } = db;

const productData = (extra = {}) => ({
  name: 'Tênis Teste',
  slug: 'tenis-teste',
  price: 200,
  price_with_discount: 149.9,
  ...extra,
});

const makeProduct = (extra = {}) => Product.create(productData(extra));

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

describe('User', () => {
  const valid = {
    firstname: 'Maria',
    surname: 'Silva',
    email: 'maria@mail.com',
    password: '$2b$10$hashdeteste',
  };

  it('cria usuário com created_at e updated_at', async () => {
    const user = await User.create(valid);
    expect(user.id).toEqual(expect.any(Number));
    const [row] = await sequelize.query('SELECT created_at, updated_at FROM users WHERE id = :id', {
      replacements: { id: user.id },
      type: QueryTypes.SELECT,
    });
    expect(row.created_at).toBeTruthy();
    expect(row.updated_at).toBeTruthy();
  });

  it('não expõe a senha no JSON, nem logo após o create', async () => {
    const user = await User.create(valid);
    expect(user.toJSON()).not.toHaveProperty('password');
    expect(JSON.parse(JSON.stringify(user))).not.toHaveProperty('password');
  });

  it('consultas normais não trazem a senha; o escopo withPassword traz', async () => {
    const created = await User.create(valid);
    const normal = await User.findByPk(created.id);
    expect(normal.password).toBeUndefined();

    const withPassword = await User.scope('withPassword').findByPk(created.id);
    expect(withPassword.password).toBe(valid.password);
  });

  it('rejeita e-mail inválido e campos obrigatórios ausentes', async () => {
    await expect(User.create({ ...valid, email: 'nao-e-email' })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(User.create({ ...valid, firstname: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(User.create({ ...valid, password: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
  });

  it('rejeita e-mail duplicado', async () => {
    await User.create(valid);
    await expect(User.create({ ...valid, firstname: 'Outra' })).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
    });
  });
});

describe('Category', () => {
  it('use_in_menu tem padrão false', async () => {
    const created = await Category.create({ name: 'Tênis', slug: 'tenis' });
    const found = await Category.findByPk(created.id);
    expect(found.use_in_menu).toBe(false);
  });

  it('aceita slug repetido (sem UNIQUE)', async () => {
    await Category.create({ name: 'A', slug: 'mesmo-slug' });
    await expect(Category.create({ name: 'B', slug: 'mesmo-slug' })).resolves.toBeTruthy();
  });

  it('rejeita name e slug ausentes', async () => {
    await expect(Category.create({ slug: 'x' })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    await expect(Category.create({ name: 'x' })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
  });
});

describe('Product', () => {
  it('aplica os valores padrão do README e deixa os campos adicionais NULL', async () => {
    const created = await makeProduct();
    const found = await Product.findByPk(created.id);

    expect(found.enabled).toBe(false);
    expect(found.use_in_menu).toBe(false);
    expect(found.stock).toBe(0);
    expect(found.description).toBeNull();
    expect(found.price).toBeCloseTo(200, 2);
    expect(found.price_with_discount).toBeCloseTo(149.9, 2);

    expect(found.brand).toBeNull();
    expect(found.reference).toBeNull();
    expect(found.rating).toBeNull();
    expect(found.reviews_count).toBeNull();
  });

  it('grava os campos adicionais quando informados', async () => {
    const created = await makeProduct({ brand: 'Nike', reference: 'REF-1', rating: 4.7, reviews_count: 90 });
    const found = await Product.findByPk(created.id);
    expect(found.brand).toBe('Nike');
    expect(found.reference).toBe('REF-1');
    expect(found.rating).toBeCloseTo(4.7, 1);
    expect(found.reviews_count).toBe(90);
  });

  it('aceita slug repetido (sem UNIQUE)', async () => {
    await makeProduct({ slug: 'igual' });
    await expect(makeProduct({ slug: 'igual', name: 'Outro' })).resolves.toBeTruthy();
  });

  it('exige name, slug, price e price_with_discount', async () => {
    await expect(Product.create({ ...productData(), name: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(Product.create({ ...productData(), slug: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(Product.create({ ...productData(), price: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(Product.create({ ...productData(), price_with_discount: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
  });

  it('rejeita valores fora da faixa (preço, estoque e nota)', async () => {
    await expect(makeProduct({ price: -1 })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    await expect(makeProduct({ stock: -5 })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    await expect(makeProduct({ rating: 6 })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    await expect(makeProduct({ reviews_count: -1 })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
  });

  it('NÃO valida desconto maior que o preço nesta etapa (fica para a Etapa 6)', async () => {
    await expect(makeProduct({ price: 100, price_with_discount: 150 })).resolves.toBeTruthy();
  });
});

describe('ProductImage', () => {
  it('product_id é obrigatório e enabled tem padrão false', async () => {
    await expect(ProductImage.create({ path: '/media/a.png' })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });

    const product = await makeProduct();
    const created = await ProductImage.create({ product_id: product.id, path: '/media/a.png' });
    const found = await ProductImage.findByPk(created.id);
    expect(found.enabled).toBe(false);
    expect(found.path).toBe('/media/a.png');
  });

  it('exige path e rejeita product_id inexistente (chave estrangeira)', async () => {
    const product = await makeProduct();
    await expect(ProductImage.create({ product_id: product.id })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(ProductImage.create({ product_id: 999999, path: '/media/x.png' })).rejects.toMatchObject({
      name: 'SequelizeForeignKeyConstraintError',
    });
  });
});

describe('ProductOption', () => {
  it('aplica os padrões: shape=square, radius=0, type=text', async () => {
    const product = await makeProduct();
    const created = await ProductOption.create({
      product_id: product.id,
      title: 'Tamanho',
      option_values: '39,40',
    });
    const found = await ProductOption.findByPk(created.id);
    expect(found.shape).toBe('square');
    expect(found.radius).toBe(0);
    expect(found.type).toBe('text');
  });

  it('rejeita shape/type fora do ENUM, title ausente e product_id inexistente', async () => {
    const product = await makeProduct();
    const base = { product_id: product.id, title: 'Cor', option_values: '#000' };

    await expect(ProductOption.create({ ...base, shape: 'triangle' })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(ProductOption.create({ ...base, type: 'image' })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(ProductOption.create({ ...base, title: undefined })).rejects.toMatchObject({
      name: 'SequelizeValidationError',
    });
    await expect(ProductOption.create({ ...base, product_id: 999999 })).rejects.toMatchObject({
      name: 'SequelizeForeignKeyConstraintError',
    });
  });

  describe('campo "values" (coluna values <-> atributo option_values)', () => {
    it('grava na coluna "values" do banco, normalizado e sem espaços', async () => {
      const product = await makeProduct();
      const created = await ProductOption.create({
        product_id: product.id,
        title: 'Tamanho',
        option_values: ['39', ' 40 ', '41', ''],
      });

      const [row] = await sequelize.query('SELECT `values` AS stored_value FROM product_options WHERE id = :id', {
        replacements: { id: created.id },
        type: QueryTypes.SELECT,
      });
      expect(row.stored_value).toBe('39,40,41');
    });

    it('a saída JSON devolve "values" (lista) e não expõe option_values', async () => {
      const product = await makeProduct();
      const created = await ProductOption.create({
        product_id: product.id,
        title: 'Tamanho',
        option_values: ['39', '40', '41'],
      });

      const found = await ProductOption.findByPk(created.id);
      const json = found.toJSON();
      expect(json.values).toEqual(['39', '40', '41']);
      expect(json).not.toHaveProperty('option_values');

      // o que o res.json() do Express faria
      const serialized = JSON.parse(JSON.stringify(found));
      expect(serialized.values).toEqual(['39', '40', '41']);
      expect(serialized).not.toHaveProperty('option_values');
      expect(serialized).toMatchObject({ title: 'Tamanho', shape: 'square', radius: 0, type: 'text' });
    });

    it('aceita texto separado por vírgula e devolve a mesma lista', async () => {
      const product = await makeProduct();
      const created = await ProductOption.create({
        product_id: product.id,
        title: 'Cor',
        type: 'color',
        option_values: '#000,#333',
      });
      const found = await ProductOption.findByPk(created.id);
      expect(found.toJSON().values).toEqual(['#000', '#333']);
    });

    it('mantém "values" dentro do produto carregado com include de options', async () => {
      const product = await makeProduct();
      await ProductOption.create({ product_id: product.id, title: 'Tamanho', option_values: ['42', '43'] });

      const loaded = await Product.findByPk(product.id, { include: ['options'] });
      const json = loaded.toJSON();
      expect(json.options).toHaveLength(1);
      expect(json.options[0].values).toEqual(['42', '43']);
      expect(json.options[0]).not.toHaveProperty('option_values');
    });

    it('rejeita lista vazia', async () => {
      const product = await makeProduct();
      await expect(
        ProductOption.create({ product_id: product.id, title: 'Tamanho', option_values: [] }),
      ).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    });
  });
});

describe('Relacionamentos', () => {
  it('produto carrega imagens, opções e categorias', async () => {
    const product = await makeProduct();
    const cat1 = await Category.create({ name: 'Casual', slug: 'casual' });
    const cat2 = await Category.create({ name: 'Corrida', slug: 'corrida' });
    await product.setCategories([cat1, cat2]);
    await ProductImage.create({ product_id: product.id, path: '/media/1.png', enabled: true });
    await ProductOption.create({ product_id: product.id, title: 'Tamanho', option_values: ['39', '40'] });

    const loaded = await Product.findByPk(product.id, { include: ['images', 'options', 'categories'] });
    expect(loaded.images).toHaveLength(1);
    expect(loaded.options).toHaveLength(1);
    expect(loaded.categories.map((c) => c.id).sort()).toEqual([cat1.id, cat2.id].sort());
  });

  it('categoria carrega seus produtos', async () => {
    const product = await makeProduct();
    const category = await Category.create({ name: 'Casual', slug: 'casual' });
    await category.addProduct(product);

    const loaded = await Category.findByPk(category.id, { include: ['products'] });
    expect(loaded.products.map((p) => p.id)).toEqual([product.id]);
  });

  it('rejeita o mesmo vínculo produto-categoria duplicado (chave composta)', async () => {
    const product = await makeProduct();
    const category = await Category.create({ name: 'Casual', slug: 'casual' });
    await ProductCategory.create({ product_id: product.id, category_id: category.id });
    await expect(
      ProductCategory.create({ product_id: product.id, category_id: category.id }),
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('apagar um produto apaga imagens, opções e vínculos, mas preserva a categoria', async () => {
    const product = await makeProduct();
    const category = await Category.create({ name: 'Casual', slug: 'casual' });
    await product.setCategories([category]);
    await ProductImage.create({ product_id: product.id, path: '/media/1.png' });
    await ProductOption.create({ product_id: product.id, title: 'Tamanho', option_values: '39' });

    await product.destroy();

    expect(await ProductImage.count()).toBe(0);
    expect(await ProductOption.count()).toBe(0);
    expect(await ProductCategory.count()).toBe(0);
    expect(await Category.count()).toBe(1);
  });

  it('apagar uma categoria remove só o vínculo; o produto permanece', async () => {
    const product = await makeProduct();
    const category = await Category.create({ name: 'Casual', slug: 'casual' });
    await product.setCategories([category]);

    await category.destroy();

    expect(await ProductCategory.count()).toBe(0);
    expect(await Product.count()).toBe(1);
  });
});
