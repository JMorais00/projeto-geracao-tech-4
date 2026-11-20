// Confere, no banco drip_store_test, se as tabelas migradas seguem o README.
// Somente leitura (information_schema). Rode antes: npm run db:migrate:test
const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const { sequelize } = require("../../src/models");
const { assertSafeTestDatabase } = require("../helpers/testDatabase");

const col = (data_type, extra = {}) => ({
  data_type,
  nullable: false,
  default: null,
  length: null,
  auto_increment: false,
  ...extra,
});
const id = col("int", { auto_increment: true });
const fk = col("int");
const str = (nullable = false, length = 255) =>
  col("varchar", { nullable, length });
const bool = col("tinyint", { default: "0", column_type: "tinyint(1)" });
const timestamp = col("datetime");

const EXPECTED_COLUMNS = {
  users: {
    id,
    firstname: str(),
    surname: str(),
    email: str(),
    password: str(),
    created_at: timestamp,
    updated_at: timestamp,
  },
  categories: {
    id,
    name: str(),
    slug: str(),
    use_in_menu: bool,
    created_at: timestamp,
    updated_at: timestamp,
  },
  products: {
    id,
    enabled: bool,
    name: str(),
    slug: str(),
    use_in_menu: bool,
    stock: col("int", { default: "0" }),
    description: str(true, 1000),
    price: col("float"),
    price_with_discount: col("float"),
    created_at: timestamp,
    updated_at: timestamp,
    // campos adicionais aprovados (opcionais)
    brand: str(true),
    reference: str(true),
    rating: col("float", { nullable: true }),
    reviews_count: col("int", { nullable: true }),
  },
  product_images: {
    id,
    product_id: fk,
    enabled: bool,
    path: str(),
  },
  product_options: {
    id,
    product_id: fk,
    title: str(),
    shape: col("enum", {
      default: "square",
      length: 6,
      column_type: "enum('square','circle')",
    }),
    radius: col("int", { default: "0" }),
    type: col("enum", {
      default: "text",
      length: 5,
      column_type: "enum('text','color')",
    }),
    values: str(),
  },
  product_categories: {
    product_id: fk,
    category_id: fk,
  },
};

async function describeTable(table) {
  const rows = await sequelize.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS data_type, COLUMN_TYPE AS column_type,
            IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default,
            CHARACTER_MAXIMUM_LENGTH AS length, EXTRA AS extra
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table
      ORDER BY ORDINAL_POSITION`,
    { replacements: { table }, type: QueryTypes.SELECT },
  );
  const result = {};
  rows.forEach((r) => {
    result[r.name] = {
      data_type: r.data_type,
      column_type: r.column_type,
      nullable: r.is_nullable === "YES",
      default: r.column_default === null ? null : String(r.column_default),
      length: r.length === null ? null : Number(r.length),
      auto_increment: /auto_increment/.test(r.extra),
    };
  });
  return result;
}

beforeAll(async () => {
  await assertSafeTestDatabase(sequelize);
});

afterAll(async () => {
  await sequelize.close();
});

describe("Estrutura das tabelas (README)", () => {
  Object.entries(EXPECTED_COLUMNS).forEach(([table, expectedColumns]) => {
    describe(table, () => {
      let actual;
      beforeAll(async () => {
        actual = await describeTable(table);
      });

      it("tem exatamente as colunas esperadas", () => {
        expect(Object.keys(actual).sort()).toEqual(
          Object.keys(expectedColumns).sort(),
        );
      });

      Object.entries(expectedColumns).forEach(([name, spec]) => {
        it(`coluna ${name}`, () => {
          const { column_type: expectedColumnType, ...expectedRest } = spec;
          const { column_type: actualColumnType, ...actualRest } = actual[name];
          expect(actualRest).toEqual(expectedRest);
          if (expectedColumnType)
            expect(actualColumnType).toBe(expectedColumnType);
        });
      });
    });
  });
});

describe("Chaves estrangeiras e índices", () => {
  it("as 4 chaves estrangeiras existem com ON DELETE CASCADE", async () => {
    const rows = await sequelize.query(
      `SELECT k.TABLE_NAME AS table_name, k.COLUMN_NAME AS column_name,
              k.REFERENCED_TABLE_NAME AS ref_table, k.REFERENCED_COLUMN_NAME AS ref_column,
              r.DELETE_RULE AS delete_rule
         FROM information_schema.KEY_COLUMN_USAGE k
         JOIN information_schema.REFERENTIAL_CONSTRAINTS r
           ON r.CONSTRAINT_SCHEMA = k.TABLE_SCHEMA
          AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
          AND r.TABLE_NAME = k.TABLE_NAME
        WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL`,
      { type: QueryTypes.SELECT },
    );
    const summary = rows
      .map(
        (r) =>
          `${r.table_name}.${r.column_name}->${r.ref_table}.${r.ref_column}:${r.delete_rule}`,
      )
      .sort();
    expect(summary).toEqual([
      "product_categories.category_id->categories.id:CASCADE",
      "product_categories.product_id->products.id:CASCADE",
      "product_images.product_id->products.id:CASCADE",
      "product_options.product_id->products.id:CASCADE",
    ]);
  });

  it("índices esperados existem (slug NÃO é único; e-mail é único)", async () => {
    const rows = await sequelize.query(
      `SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique,
              GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE`,
      { type: QueryTypes.SELECT },
    );
    const byKey = {};
    rows.forEach((r) => {
      byKey[`${r.table_name}.${r.index_name}`] = {
        unique: Number(r.non_unique) === 0,
        cols: r.cols,
      };
    });

    expect(byKey["users.uq_users_email"]).toEqual({
      unique: true,
      cols: "email",
    });
    expect(byKey["categories.idx_categories_slug"]).toEqual({
      unique: false,
      cols: "slug",
    });
    expect(byKey["products.idx_products_slug"]).toEqual({
      unique: false,
      cols: "slug",
    });
    expect(byKey["products.idx_products_brand"]).toEqual({
      unique: false,
      cols: "brand",
    });
    expect(byKey["product_images.idx_product_images_product_id"]).toEqual({
      unique: false,
      cols: "product_id",
    });
    expect(byKey["product_options.idx_product_options_product_id"]).toEqual({
      unique: false,
      cols: "product_id",
    });
    expect(
      byKey["product_categories.idx_product_categories_category_id"],
    ).toEqual({
      unique: false,
      cols: "category_id",
    });
    expect(byKey["product_categories.PRIMARY"]).toEqual({
      unique: true,
      cols: "product_id,category_id",
    });
  });

  it("as 7 migrations constam como aplicadas em SequelizeMeta", async () => {
    const dir = path.resolve(__dirname, "../../src/database/migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));
    const rows = await sequelize.query("SELECT name FROM SequelizeMeta", {
      type: QueryTypes.SELECT,
    });
    const applied = rows.map((r) => r.name);
    files.forEach((file) => expect(applied).toContain(file));
  });
});
