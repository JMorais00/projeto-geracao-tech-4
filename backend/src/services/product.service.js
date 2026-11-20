const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { Op, Sequelize } = require("sequelize");
const {
  sequelize,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
  Category,
} = require("../models");
const { badRequest, notFound } = require("../utils/AppError");

const MEDIA_PUBLIC_ROOT = path.resolve(__dirname, "..", "..", "media");
const MEDIA_ROOT = path.resolve(
  MEDIA_PUBLIC_ROOT,
  process.env.NODE_ENV === "test" ? "test" : "",
);
const DEFAULT_FIELDS = [
  "id",
  "enabled",
  "name",
  "slug",
  "use_in_menu",
  "stock",
  "description",
  "price",
  "price_with_discount",
  "brand",
  "reference",
  "rating",
  "reviews_count",
  "category_ids",
  "images",
  "options",
];
const SCALAR_FIELDS = [
  "id",
  "enabled",
  "name",
  "slug",
  "use_in_menu",
  "stock",
  "description",
  "price",
  "price_with_discount",
  "brand",
  "reference",
  "rating",
  "reviews_count",
];
const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function toImageJson(image) {
  const item = image.get ? image.get({ plain: true }) : image;
  return { id: item.id, content: item.path };
}

function toOptionJson(option) {
  const item = option.get ? option.get({ plain: true }) : option;
  const storedValues = item.option_values ?? item.values ?? "";
  return {
    id: item.id,
    title: item.title,
    shape: item.shape,
    radius: item.radius,
    type: item.type,
    values: Array.isArray(storedValues)
      ? storedValues
      : String(storedValues)
          .split(",")
          .filter((value) => value !== ""),
  };
}

function toProductJson(product, fields = DEFAULT_FIELDS) {
  const plain = product.get ? product.get({ plain: true }) : product;
  const output = {};
  for (const field of fields) {
    if (SCALAR_FIELDS.includes(field)) output[field] = plain[field];
    if (field === "category_ids")
      output.category_ids = (plain.categories || [])
        .map((category) => category.id)
        .sort((a, b) => a - b);
    if (field === "images")
      output.images = (plain.images || []).map(toImageJson);
    if (field === "options")
      output.options = (plain.options || []).map(toOptionJson);
  }
  return output;
}

function inferImageType(buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "image/jpeg";
  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
  )
    return "image/gif";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  return null;
}

function parseBase64Content(content, declaredType) {
  let base64 = content;
  let contentType = declaredType;
  const dataUri =
    /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([\s\S]+)$/i.exec(content);
  if (dataUri) {
    contentType = dataUri[1].toLowerCase();
    base64 = dataUri[2];
    if (
      declaredType &&
      declaredType !== contentType &&
      !(declaredType === "image/jpeg" && contentType === "image/jpg") &&
      !(declaredType === "image/jpg" && contentType === "image/jpeg")
    ) {
      throw badRequest("O tipo da imagem não corresponde ao conteúdo enviado");
    }
  }

  base64 = base64.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 === 1) {
    throw badRequest(
      "O conteúdo da imagem deve estar em Base64 válido ou ser uma URL HTTP(S)",
    );
  }
  const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const buffer = Buffer.from(normalizedBase64, "base64");
  if (!buffer.length || buffer.toString("base64") !== normalizedBase64) {
    throw badRequest("O conteúdo da imagem deve estar em Base64 válido");
  }
  const detectedType = inferImageType(buffer);
  if (!contentType) contentType = detectedType;
  if (!contentType || !MIME_EXTENSIONS[contentType]) {
    throw badRequest("Tipo de imagem inválido ou ausente");
  }
  const compatibleTypes = new Set([
    contentType,
    contentType === "image/jpg" ? "image/jpeg" : "image/jpg",
  ]);
  if (!detectedType || !compatibleTypes.has(detectedType)) {
    throw badRequest(
      "O conteúdo enviado não corresponde a um arquivo de imagem do tipo informado",
    );
  }
  if (buffer.length > 7 * 1024 * 1024) {
    throw badRequest("Cada imagem deve ter no máximo 7 MB");
  }
  return { buffer, contentType };
}

async function saveImageContent(productId, image) {
  const content = image.content;
  if (/^https?:\/\//i.test(content)) {
    let parsed;
    try {
      parsed = new URL(content);
    } catch {
      throw badRequest("URL de imagem inválida");
    }
    if (!["http:", "https:"].includes(parsed.protocol))
      throw badRequest("URL de imagem inválida");
    return content;
  }

  const { buffer, contentType } = parseBase64Content(content, image.type);
  const folderName = `product-${productId}`;
  const folderPath = path.join(MEDIA_ROOT, folderName);
  await fs.mkdir(folderPath, { recursive: true });
  const filename = `${randomUUID()}.${MIME_EXTENSIONS[contentType]}`;
  await fs.writeFile(path.join(folderPath, filename), buffer, { flag: "wx" });
  // No ambiente de teste os arquivos ficam em media/test e a URL precisa refletir esse caminho.
  const publicFolder =
    process.env.NODE_ENV === "test" ? `test/${folderName}` : folderName;
  return `/media/${publicFolder}/${filename}`;
}

function localImageAbsolutePath(imagePath) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/media/"))
    return null;
  const relative = imagePath.slice("/media/".length);
  const absolute = path.resolve(MEDIA_PUBLIC_ROOT, relative);
  if (!absolute.startsWith(`${MEDIA_PUBLIC_ROOT}${path.sep}`)) return null;
  return absolute;
}

async function removeLocalImage(imagePath) {
  const absolute = localImageAbsolutePath(imagePath);
  if (!absolute) return;
  try {
    await fs.unlink(absolute);
    const folder = path.dirname(absolute);
    try {
      await fs.rmdir(folder);
    } catch {
      /* pasta ainda contém imagens */
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function cleanCreatedFiles(paths) {
  await Promise.all(
    paths.map((imagePath) => removeLocalImage(imagePath).catch(() => {})),
  );
}

async function assertCategoriesExist(categoryIds, transaction) {
  if (!categoryIds || categoryIds.length === 0) return;
  const count = await Category.count({
    where: { id: { [Op.in]: categoryIds } },
    transaction,
  });
  if (count !== categoryIds.length)
    throw badRequest("Um ou mais IDs de categoria não existem");
}

async function applyNewImages(productId, images, transaction, createdFiles) {
  for (const image of images || []) {
    const imagePath = await saveImageContent(productId, image);
    if (imagePath.startsWith("/media/")) createdFiles.push(imagePath);
    await ProductImage.create(
      {
        product_id: productId,
        enabled: image.enabled ?? false,
        path: imagePath,
      },
      { transaction },
    );
  }
}

async function applyNewOptions(productId, options, transaction) {
  for (const option of options || []) {
    await ProductOption.create(
      {
        product_id: productId,
        title: option.title,
        shape: option.shape,
        radius: option.radius,
        type: option.type,
        option_values: option.values,
      },
      { transaction },
    );
  }
}

async function searchOptionProductIds(optionId, requestedValues) {
  const option = await ProductOption.findByPk(optionId, {
    attributes: ["id", "product_id", "option_values"],
  });
  if (!option) return [];
  const values = String(option.option_values || "").split(",");
  return requestedValues.some((value) => values.includes(value))
    ? [option.product_id]
    : [];
}

async function search({
  limit,
  page,
  fields,
  match,
  category_ids: categoryIds,
  "price-range": priceRange,
  option,
}) {
  const selectedFields = fields || DEFAULT_FIELDS;
  const attributes = [
    ...new Set([
      ...selectedFields.filter((field) => SCALAR_FIELDS.includes(field)),
      "id",
    ]),
  ];
  const where = {};

  if (match) {
    where[Op.or] = [
      { name: { [Op.like]: `%${match}%` } },
      { description: { [Op.like]: `%${match}%` } },
    ];
  }

  if (priceRange) {
    where[Op.and] = [
      Sequelize.where(
        Sequelize.literal(
          "CASE WHEN `Product`.`price_with_discount` > 0 THEN `Product`.`price_with_discount` ELSE `Product`.`price` END",
        ),
        { [Op.between]: priceRange },
      ),
    ];
  }

  if (categoryIds) {
    const rows = await ProductCategory.findAll({
      attributes: ["product_id"],
      where: { category_id: { [Op.in]: categoryIds } },
      raw: true,
    });
    const productIds = [...new Set(rows.map((row) => row.product_id))];
    if (!productIds.length) where.id = { [Op.in]: [0] };
    else where.id = { [Op.in]: productIds };
  }

  if (option) {
    let allowedProductIds = null;
    for (const [optionId, rawValues] of Object.entries(option)) {
      const values = rawValues
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const matchingIds = await searchOptionProductIds(
        Number(optionId),
        values,
      );
      allowedProductIds =
        allowedProductIds === null
          ? matchingIds
          : allowedProductIds.filter((id) => matchingIds.includes(id));
    }
    if (!allowedProductIds || !allowedProductIds.length)
      where.id = { [Op.in]: [0] };
    else if (where.id && where.id[Op.in]) {
      where.id = {
        [Op.in]: where.id[Op.in].filter((id) => allowedProductIds.includes(id)),
      };
      if (!where.id[Op.in].length) where.id = { [Op.in]: [0] };
    } else where.id = { [Op.in]: allowedProductIds };
  }

  const include = [];
  if (selectedFields.includes("category_ids")) {
    include.push({
      model: Category,
      as: "categories",
      attributes: ["id"],
      through: { attributes: [] },
    });
  }
  if (selectedFields.includes("images")) {
    include.push({
      model: ProductImage,
      as: "images",
      attributes: ["id", "path"],
      separate: true,
      order: [["id", "ASC"]],
    });
  }
  if (selectedFields.includes("options")) {
    include.push({
      model: ProductOption,
      as: "options",
      attributes: ["id", "title", "shape", "radius", "type", "option_values"],
      separate: true,
      order: [["id", "ASC"]],
    });
  }

  const query = {
    attributes,
    where,
    include,
    order: [["id", "ASC"]],
    distinct: true,
  };
  if (limit !== -1) {
    query.limit = limit;
    query.offset = (page - 1) * limit;
  }

  const result = await Product.findAndCountAll(query);
  return {
    data: result.rows.map((product) => toProductJson(product, selectedFields)),
    total: result.count,
    limit,
    page: limit === -1 ? 1 : page,
  };
}

async function getById(id) {
  const product = await Product.findByPk(id, {
    attributes: SCALAR_FIELDS,
    include: [
      {
        model: Category,
        as: "categories",
        attributes: ["id"],
        through: { attributes: [] },
      },
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "path"],
        separate: true,
        order: [["id", "ASC"]],
      },
      {
        model: ProductOption,
        as: "options",
        attributes: ["id", "title", "shape", "radius", "type", "option_values"],
        separate: true,
        order: [["id", "ASC"]],
      },
    ],
  });
  if (!product) throw notFound("Produto não encontrado");
  return toProductJson(product);
}

async function create(data) {
  const transaction = await sequelize.transaction();
  const createdFiles = [];
  let productId;
  try {
    const { category_ids: categoryIds, images, options, ...productData } = data;
    await assertCategoriesExist(categoryIds, transaction);
    const product = await Product.create(productData, { transaction });
    productId = product.id;
    if (categoryIds.length) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: categoryIds } },
        transaction,
      });
      await product.setCategories(categories, { transaction });
    }
    await applyNewImages(product.id, images, transaction, createdFiles);
    await applyNewOptions(product.id, options, transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    await cleanCreatedFiles(createdFiles);
    throw error;
  }
  return getById(productId);
}

async function updateImages(
  productId,
  images,
  transaction,
  createdFiles,
  removedFiles,
) {
  for (const image of images || []) {
    if (image.id) {
      const existing = await ProductImage.findOne({
        where: { id: image.id, product_id: productId },
        transaction,
      });
      if (!existing)
        throw badRequest(`A imagem ${image.id} não pertence a este produto`);
      if (image.deleted) {
        removedFiles.push(existing.path);
        await existing.destroy({ transaction });
        continue;
      }
      const changes = {};
      if (image.enabled !== undefined) changes.enabled = image.enabled;
      if (image.content !== undefined) {
        const newPath = await saveImageContent(productId, image);
        if (newPath.startsWith("/media/")) createdFiles.push(newPath);
        removedFiles.push(existing.path);
        changes.path = newPath;
      }
      await existing.update(changes, { transaction });
    } else {
      const imagePath = await saveImageContent(productId, image);
      if (imagePath.startsWith("/media/")) createdFiles.push(imagePath);
      await ProductImage.create(
        {
          product_id: productId,
          enabled: image.enabled ?? false,
          path: imagePath,
        },
        { transaction },
      );
    }
  }
}

async function updateOptions(productId, options, transaction) {
  for (const option of options || []) {
    if (option.id) {
      const existing = await ProductOption.findOne({
        where: { id: option.id, product_id: productId },
        transaction,
      });
      if (!existing)
        throw badRequest(`A opção ${option.id} não pertence a este produto`);
      if (option.deleted) {
        await existing.destroy({ transaction });
        continue;
      }
      const changes = {};
      for (const field of ["title", "shape", "radius", "type"]) {
        if (option[field] !== undefined) changes[field] = option[field];
      }
      if (option.values !== undefined) changes.option_values = option.values;
      await existing.update(changes, { transaction });
    } else {
      await ProductOption.create(
        {
          product_id: productId,
          title: option.title,
          shape: option.shape,
          radius: option.radius,
          type: option.type,
          option_values: option.values,
        },
        { transaction },
      );
    }
  }
}

async function update(id, data) {
  const transaction = await sequelize.transaction();
  const createdFiles = [];
  const removedFiles = [];
  try {
    const product = await Product.findByPk(id, { transaction });
    if (!product) throw notFound("Produto não encontrado");

    const { category_ids: categoryIds, images, options, ...productData } = data;
    if (Object.keys(productData).length)
      await product.update(productData, { transaction });

    if (categoryIds !== undefined) {
      await assertCategoriesExist(categoryIds, transaction);
      const categories = categoryIds.length
        ? await Category.findAll({
            where: { id: { [Op.in]: categoryIds } },
            transaction,
          })
        : [];
      await product.setCategories(categories, { transaction });
    }
    if (images !== undefined)
      await updateImages(id, images, transaction, createdFiles, removedFiles);
    if (options !== undefined) await updateOptions(id, options, transaction);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    await cleanCreatedFiles(createdFiles);
    throw error;
  }
  await Promise.all(
    removedFiles.map((imagePath) =>
      removeLocalImage(imagePath).catch(() => {}),
    ),
  );
}

async function remove(id) {
  const transaction = await sequelize.transaction();
  let imagePaths;
  try {
    const product = await Product.findByPk(id, {
      include: [{ model: ProductImage, as: "images", attributes: ["path"] }],
      transaction,
    });
    if (!product) throw notFound("Produto não encontrado");
    imagePaths = product.images.map((image) => image.path);
    await product.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await Promise.all(
    imagePaths.map((imagePath) => removeLocalImage(imagePath).catch(() => {})),
  );
}

module.exports = { search, getById, create, update, remove };
