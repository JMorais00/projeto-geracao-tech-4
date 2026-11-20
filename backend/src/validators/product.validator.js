const Joi = require('joi');
const { idParamSchema } = require('./common.validator');

const positiveId = Joi.number().integer().min(1).max(2147483647);
const mimeType = Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif');
const imageContent = Joi.string().trim().min(1).max(10 * 1024 * 1024).required();
const optionValues = Joi.array()
  .items(Joi.string().trim().min(1).max(255).custom((value, helpers) => {
    if (value.includes(',')) return helpers.error('any.invalid');
    return value;
  }))
  .min(1);

function normalizeOptionAliases(value, helpers) {
  const hasValues = Object.prototype.hasOwnProperty.call(value, 'values');
  const hasValue = Object.prototype.hasOwnProperty.call(value, 'value');
  if (hasValues && hasValue) return helpers.error('any.invalid');
  if (hasValue) {
    const normalized = { ...value, values: value.value };
    delete normalized.value;
    return normalized;
  }
  return value;
}

const radius = Joi.alternatives()
  .try(
    Joi.number().integer().min(0).max(1000),
    Joi.string().pattern(/^\d+(?:px)?$/).custom((value) => Number.parseInt(value, 10)),
  );

const newOptionSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  shape: Joi.string().valid('square', 'circle').default('square'),
  radius: radius.default(0),
  type: Joi.string().valid('text', 'color').default('text'),
  values: optionValues,
  value: optionValues,
}).custom(normalizeOptionAliases, 'normalização do campo values').custom((value, helpers) => {
  if (!value.values) return helpers.error('any.required');
  return value;
}, 'valores obrigatórios');

const updateOptionSchema = Joi.object({
  id: positiveId,
  deleted: Joi.boolean().valid(true),
  title: Joi.string().trim().min(1).max(255),
  shape: Joi.string().valid('square', 'circle'),
  radius,
  type: Joi.string().valid('text', 'color'),
  values: optionValues,
  value: optionValues,
}).custom(normalizeOptionAliases, 'normalização do campo values').custom((value, helpers) => {
  if (value.deleted === true) {
    if (Object.keys(value).length !== 2 || !value.id) return helpers.error('any.invalid');
    return value;
  }
  if (value.id) {
    if (Object.keys(value).length < 2) return helpers.error('object.min');
    return value;
  }
  if (!value.title || !value.values) return helpers.error('any.invalid');
  return value;
}, 'validação de opção nova ou existente');

const createImageSchema = Joi.object({
  type: mimeType.required(),
  content: imageContent,
  enabled: Joi.boolean().default(false),
});

const updateImageSchema = Joi.object({
  id: positiveId,
  deleted: Joi.boolean().valid(true),
  type: mimeType,
  content: Joi.string().trim().min(1).max(10 * 1024 * 1024),
  enabled: Joi.boolean(),
}).custom((value, helpers) => {
  if (value.deleted === true) {
    if (Object.keys(value).length !== 2 || !value.id) return helpers.error('any.invalid');
    return value;
  }
  if (value.id) {
    if (!value.content && value.enabled === undefined) return helpers.error('object.min');
    return value;
  }
  if (!value.content) return helpers.error('any.invalid');
  return value;
}, 'validação de imagem nova ou existente');

const productFields = {
  enabled: Joi.boolean(),
  name: Joi.string().trim().min(1).max(255),
  slug: Joi.string().trim().min(1).max(255),
  use_in_menu: Joi.boolean(),
  stock: Joi.number().integer().min(0).max(2147483647),
  description: Joi.string().allow('', null).max(1000),
  price: Joi.number().precision(2).min(0).max(999999999),
  price_with_discount: Joi.number().precision(2).min(0).max(999999999),
  // Campos opcionais previamente acrescentados para compatibilidade com o frontend.
  brand: Joi.string().trim().max(255).allow(null, ''),
  reference: Joi.string().trim().max(255).allow(null, ''),
  rating: Joi.number().precision(2).min(0).max(5).allow(null),
  reviews_count: Joi.number().integer().min(0).max(2147483647).allow(null),
};

const categoryIds = Joi.array().items(positiveId).unique().max(1000);

const createSchema = Joi.object({
  enabled: productFields.enabled.default(false),
  name: productFields.name.required(),
  slug: productFields.slug.required(),
  use_in_menu: productFields.use_in_menu.default(false),
  stock: productFields.stock.default(0),
  description: productFields.description,
  price: productFields.price.required(),
  price_with_discount: productFields.price_with_discount.required(),
  brand: productFields.brand,
  reference: productFields.reference,
  rating: productFields.rating,
  reviews_count: productFields.reviews_count,
  category_ids: categoryIds.required(),
  images: Joi.array().items(createImageSchema).default([]).max(100),
  options: Joi.array().items(newOptionSchema).default([]).max(100),
});

const updateSchema = Joi.object({
  ...productFields,
  category_ids: categoryIds,
  images: Joi.array().items(updateImageSchema).max(100),
  options: Joi.array().items(updateOptionSchema).max(100),
}).min(1);

const ALLOWED_FIELDS = new Set([
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'brand', 'reference', 'rating', 'reviews_count',
  'category_ids', 'images', 'options',
]);

const searchSchema = Joi.object({
  // Joi converte os valores da query string em números antes de chegar ao Sequelize.
  limit: Joi.number()
    .integer()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER)
    .allow(-1)
    .default(12),
  page: Joi.number()
    .integer()
    .min(1)
    .max(Number.MAX_SAFE_INTEGER)
    .default(1),
  fields: Joi.string().custom((value, helpers) => {
    const fields = value.split(',');
    if (fields.some((field) => !field || !ALLOWED_FIELDS.has(field)) || new Set(fields).size !== fields.length) {
      return helpers.error('any.invalid');
    }
    return fields;
  }),
  match: Joi.string().trim().min(1).max(255),
  category_ids: Joi.string().custom((value, helpers) => {
    const parts = value.split(',');
    if (!parts.length || parts.some((part) => !/^[1-9]\d{0,9}$/.test(part))) return helpers.error('any.invalid');
    const ids = parts.map(Number);
    if (ids.some((id) => id > 2147483647) || new Set(ids).size !== ids.length) return helpers.error('any.invalid');
    return ids;
  }),
  'price-range': Joi.string().pattern(/^\d+(?:\.\d+)?-\d+(?:\.\d+)?$/).custom((value, helpers) => {
    const [minimum, maximum] = value.split('-').map(Number);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) return helpers.error('any.invalid');
    return [minimum, maximum];
  }),
  option: Joi.object().pattern(/^[1-9]\d{0,9}$/, Joi.string().trim().min(1).max(255)).min(1),
})
  .unknown(false)
  .custom((query, helpers) => {
    if (query.limit !== -1 && !Number.isSafeInteger((query.page - 1) * query.limit)) return helpers.error('any.invalid');
    if (query.option) {
      for (const id of Object.keys(query.option)) {
        if (Number(id) > 2147483647) return helpers.error('any.invalid');
      }
    }
    return query;
  }, 'validação dos filtros');

module.exports = { idParamSchema, createSchema, updateSchema, searchSchema };
