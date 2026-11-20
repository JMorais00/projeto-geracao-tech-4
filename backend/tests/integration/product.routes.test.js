// Testes de integração de produtos. Gravam dados SOMENTE em drip_store_test.
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "segredo-de-teste-integracao";

const fs = require("fs/promises");
const path = require("path");
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/models");
const {
  assertSafeTestDatabase,
  assertMigrated,
  cleanDatabase,
} = require("../helpers/testDatabase");

const {
  sequelize,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
} = db;
const password = "123@123";
const userBody = {
  firstname: "Teste",
  surname: "Produtos",
  email: "produtos@mail.com",
  password,
  confirmPassword: password,
};
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ14AAAAASUVORK5CYII=";

async function createToken() {
  await request(app).post("/v1/user").send(userBody);
  const response = await request(app)
    .post("/v1/user/token")
    .send({ email: userBody.email, password });
  expect(response.status).toBe(200);
  return response.body.token;
}

const auth = (value) => ({ Authorization: `Bearer ${value}` });
const categoryBody = (name, slug) => ({ name, slug, use_in_menu: true });
const productBody = (overrides = {}) => ({
  name: "Tênis de corrida",
  slug: "tenis-de-corrida",
  enabled: true,
  stock: 10,
  description: "Tênis confortável para corrida",
  price: 199.9,
  price_with_discount: 159.9,
  category_ids: [],
  ...overrides,
});

beforeAll(async () => {
  await assertSafeTestDatabase(sequelize);
  await assertMigrated(sequelize);
});

beforeEach(async () => {
  await cleanDatabase(db);
  await fs.rm(path.resolve(__dirname, "../../media/test"), {
    recursive: true,
    force: true,
  });
});

afterAll(async () => {
  try {
    await cleanDatabase(db);
    await fs.rm(path.resolve(__dirname, "../../media/test"), {
      recursive: true,
      force: true,
    });
  } finally {
    await sequelize.close();
  }
});

describe("GET /v1/product/search", () => {
  it("retorna produtos com paginação e campos padrão em ordem crescente de id", async () => {
    await Product.bulkCreate([
      productBody(),
      productBody({
        name: "Camiseta",
        slug: "camiseta",
        price: 49.9,
        price_with_discount: 0,
      }),
    ]);
    const response = await request(app).get("/v1/product/search");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 2, limit: 12, page: 1 });
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].id).toBeLessThan(response.body.data[1].id);
    expect(response.body.data[0]).toHaveProperty("category_ids");
    expect(response.body.data[0]).toHaveProperty("images");
    expect(response.body.data[0]).toHaveProperty("options");
  });

  it("seleciona fields e aplica match, categoria e price-range", async () => {
    const category = await Category.create(
      categoryBody("Calçados", "calcados"),
    );
    const matching = await Product.create(productBody());
    const other = await Product.create(
      productBody({
        name: "Camiseta",
        slug: "camiseta",
        price: 120,
        price_with_discount: 0,
      }),
    );
    await matching.addCategory(category);
    await other.addCategory(category);

    const response = await request(app).get(
      `/v1/product/search?match=corrida&category_ids=${category.id}&price-range=150-170&fields=name,price`,
    );
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data).toEqual([
      { name: "Tênis de corrida", price: 199.9 },
    ]);
  });

  it("filtra pelo valor da opção referenciada em option[id]", async () => {
    const product = await Product.create(productBody());
    const option = await ProductOption.create({
      product_id: product.id,
      title: "Tamanho",
      shape: "circle",
      radius: 4,
      type: "text",
      option_values: ["PP", "GG"],
    });
    const response = await request(app).get(
      `/v1/product/search?option[${option.id}]=GG,PP`,
    );
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].id).toBe(product.id);
  });

  it("aceita limit=-1 e valida parâmetros desconhecidos ou inválidos", async () => {
    await Product.bulkCreate([
      productBody(),
      productBody({ name: "Camiseta", slug: "camiseta" }),
    ]);
    const all = await request(app).get("/v1/product/search?limit=-1&page=9");
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ total: 2, limit: -1, page: 1 });
    expect(all.body.data).toHaveLength(2);

    for (const query of [
      "limit=0",
      "page=0",
      "fields=",
      "fields=password",
      "category_ids=1,x",
      "price-range=20-10",
      "extra=x",
    ]) {
      expect(
        (await request(app).get(`/v1/product/search?${query}`)).status,
      ).toBe(400);
    }
  });
});

describe("GET /v1/product/:id", () => {
  it("retorna produto, categorias, imagens e opções", async () => {
    const category = await Category.create(
      categoryBody("Calçados", "calcados"),
    );
    const product = await Product.create(
      productBody({
        brand: "Marca",
        reference: "REF-1",
        rating: 4.5,
        reviews_count: 8,
      }),
    );
    await product.addCategory(category);
    await ProductImage.create({
      product_id: product.id,
      enabled: true,
      path: "https://cdn.example.test/tenis.png",
    });
    await ProductOption.create({
      product_id: product.id,
      title: "Tamanho",
      shape: "square",
      radius: 0,
      type: "text",
      option_values: ["39", "40"],
    });

    const response = await request(app).get(`/v1/product/${product.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: product.id,
      brand: "Marca",
      reference: "REF-1",
      rating: 4.5,
      reviews_count: 8,
      category_ids: [category.id],
      images: [{ content: "https://cdn.example.test/tenis.png" }],
      options: [{ title: "Tamanho", values: ["39", "40"] }],
    });
    expect(JSON.stringify(response.body)).not.toContain("option_values");
  });

  it("retorna 400 para id inválido e 404 para produto inexistente", async () => {
    expect((await request(app).get("/v1/product/abc")).status).toBe(400);
    expect((await request(app).get("/v1/product/999999")).status).toBe(404);
  });
});

describe("POST /v1/product", () => {
  it("exige token e cria produto com categorias, imagens e opções", async () => {
    expect(
      (await request(app).post("/v1/product").send(productBody())).status,
    ).toBe(401);
    const token = await createToken();
    const category = await Category.create(
      categoryBody("Calçados", "calcados"),
    );
    const response = await request(app)
      .post("/v1/product")
      .set(auth(token))
      .send(
        productBody({
          category_ids: [category.id],
          images: [
            {
              type: "image/png",
              content: "https://cdn.example.test/tenis.png",
              enabled: true,
            },
          ],
          options: [
            {
              title: "Tamanho",
              shape: "circle",
              radius: "4px",
              type: "text",
              values: ["39", "40"],
            },
          ],
        }),
      );
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Tênis de corrida",
      category_ids: [category.id],
      images: [{ content: "https://cdn.example.test/tenis.png" }],
      options: [{ title: "Tamanho", radius: 4, values: ["39", "40"] }],
    });
  });

  it("salva uma imagem Base64 em media e devolve URL servível", async () => {
    const token = await createToken();
    const response = await request(app)
      .post("/v1/product")
      .set(auth(token))
      .send(
        productBody({
          images: [{ type: "image/png", content: PNG_BASE64 }],
        }),
      );
    expect(response.status).toBe(201);
    const imageUrl = response.body.images[0].content;
    expect(imageUrl).toMatch(/^\/media\/test\/product-/);
    expect((await request(app).get(imageUrl)).status).toBe(200);
  });

  it("rejeita categoria inexistente, Base64 inválido e campos não permitidos", async () => {
    const token = await createToken();
    expect(
      (
        await request(app)
          .post("/v1/product")
          .set(auth(token))
          .send(productBody({ category_ids: [999999] }))
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/v1/product")
          .set(auth(token))
          .send(
            productBody({
              images: [{ type: "image/png", content: "não é base64" }],
            }),
          )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/v1/product")
          .set(auth(token))
          .send(productBody({ unexpected: true }))
      ).status,
    ).toBe(400);
  });
});

describe("PUT /v1/product/:id", () => {
  it("atualiza dados e associações, incluindo criação e exclusão de imagens e opções", async () => {
    const token = await createToken();
    const firstCategory = await Category.create(
      categoryBody("Calçados", "calcados"),
    );
    const secondCategory = await Category.create(
      categoryBody("Ofertas", "ofertas"),
    );
    const product = await Product.create(productBody());
    await product.addCategory(firstCategory);
    const image = await ProductImage.create({
      product_id: product.id,
      enabled: true,
      path: "https://cdn.example.test/old.png",
    });
    const option = await ProductOption.create({
      product_id: product.id,
      title: "Tamanho",
      shape: "square",
      radius: 0,
      type: "text",
      option_values: ["P", "M"],
    });

    expect(
      (await request(app).put(`/v1/product/${product.id}`).send({ stock: 20 }))
        .status,
    ).toBe(401);
    const updated = await request(app)
      .put(`/v1/product/${product.id}`)
      .set(auth(token))
      .send({
        name: "Tênis atualizado",
        stock: 20,
        category_ids: [secondCategory.id],
        images: [
          { id: image.id, deleted: true },
          { content: "https://cdn.example.test/new.png", enabled: true },
        ],
        options: [
          { id: option.id, deleted: true },
          {
            title: "Cor",
            shape: "circle",
            radius: "10px",
            type: "color",
            value: ["#000", "#fff"],
          },
        ],
      });
    expect(updated.status).toBe(204);

    const detail = await request(app).get(`/v1/product/${product.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({
      name: "Tênis atualizado",
      stock: 20,
      category_ids: [secondCategory.id],
      images: [{ content: "https://cdn.example.test/new.png" }],
      options: [{ title: "Cor", radius: 10, values: ["#000", "#fff"] }],
    });
    expect(await ProductImage.findByPk(image.id)).toBeNull();
    expect(await ProductOption.findByPk(option.id)).toBeNull();
  });

  it("retorna 400 para referência de imagem/opção de outro produto e 404 para produto inexistente", async () => {
    const token = await createToken();
    const first = await Product.create(productBody());
    const second = await Product.create(
      productBody({ name: "Outro", slug: "outro" }),
    );
    const image = await ProductImage.create({
      product_id: second.id,
      enabled: false,
      path: "https://cdn.example.test/other.png",
    });
    const option = await ProductOption.create({
      product_id: second.id,
      title: "Cor",
      option_values: ["azul"],
    });
    expect(
      (
        await request(app)
          .put(`/v1/product/${first.id}`)
          .set(auth(token))
          .send({ images: [{ id: image.id, deleted: true }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/v1/product/${first.id}`)
          .set(auth(token))
          .send({ options: [{ id: option.id, deleted: true }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put("/v1/product/999999")
          .set(auth(token))
          .send({ stock: 2 })
      ).status,
    ).toBe(404);
  });
});

describe("DELETE /v1/product/:id", () => {
  it("exige token, remove produto e registros relacionados por cascade", async () => {
    const token = await createToken();
    const product = await Product.create(productBody());
    const category = await Category.create(
      categoryBody("Calçados", "calcados"),
    );
    await product.addCategory(category);
    await ProductImage.create({
      product_id: product.id,
      enabled: false,
      path: "https://cdn.example.test/tenis.png",
    });
    await ProductOption.create({
      product_id: product.id,
      title: "Tamanho",
      option_values: ["39"],
    });

    expect(
      (await request(app).delete(`/v1/product/${product.id}`)).status,
    ).toBe(401);
    const response = await request(app)
      .delete(`/v1/product/${product.id}`)
      .set(auth(token));
    expect(response.status).toBe(204);
    expect(await Product.findByPk(product.id)).toBeNull();
    expect(
      await ProductImage.count({ where: { product_id: product.id } }),
    ).toBe(0);
    expect(
      await ProductOption.count({ where: { product_id: product.id } }),
    ).toBe(0);
    expect(
      await ProductCategory.count({ where: { product_id: product.id } }),
    ).toBe(0);
    expect(await Category.findByPk(category.id)).not.toBeNull();
  });

  it("exclui do disco a imagem Base64 do produto removido", async () => {
    const token = await createToken();
    const created = await request(app)
      .post("/v1/product")
      .set(auth(token))
      .send(
        productBody({ images: [{ type: "image/png", content: PNG_BASE64 }] }),
      );
    expect(created.status).toBe(201);
    const url = created.body.images[0].content;
    expect((await request(app).get(url)).status).toBe(200);
    expect(
      (
        await request(app)
          .delete(`/v1/product/${created.body.id}`)
          .set(auth(token))
      ).status,
    ).toBe(204);
    expect((await request(app).get(url)).status).toBe(404);
  });

  it("retorna 404 para produto inexistente", async () => {
    const token = await createToken();
    expect(
      (await request(app).delete("/v1/product/999999").set(auth(token))).status,
    ).toBe(404);
  });
});
