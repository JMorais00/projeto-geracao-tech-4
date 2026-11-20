const Joi = require('joi');

// Campos que podem ser pedidos em ?fields= (timestamps não fazem parte da API)
const CATEGORY_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const toNumber = (value) => Number(value);

// "fields=name,slug" -> ['name', 'slug'] (sem repetições; só campos permitidos)
function parseFields(value, helpers) {
  const items = value.split(',').map((item) => item.trim());
  if (items.some((item) => item === '')) return helpers.error('fields.empty');
  if (items.some((item) => !CATEGORY_FIELDS.includes(item))) return helpers.error('fields.invalid');
  return [...new Set(items)];
}

// GET /v1/category/search
const searchQuerySchema = Joi.object({
  // -1 = todos os registros; senão inteiro positivo. Padrão: 12
  limit: Joi.string()
    .pattern(/^(-1|[1-9]\d{0,8})$/)
    .custom(toNumber, 'limit inteiro')
    .default(12)
    .messages({ 'string.pattern.base': 'limit deve ser -1 ou um inteiro positivo' }),
  // inteiro positivo. Padrão: 1 (sem efeito quando limit=-1)
  page: Joi.string()
    .pattern(/^[1-9]\d{0,8}$/)
    .custom(toNumber, 'page inteiro')
    .default(1)
    .messages({ 'string.pattern.base': 'page deve ser um inteiro positivo' }),
  use_in_menu: Joi.boolean().messages({ 'boolean.base': 'use_in_menu deve ser true ou false' }),
  fields: Joi.string()
    .custom(parseFields, 'lista de campos')
    .messages({
      'fields.empty': 'fields não pode ter itens vazios',
      'fields.invalid': `fields aceita apenas: ${CATEGORY_FIELDS.join(', ')}`,
    }),
});

const requiredText = Joi.string().trim().min(1).max(255).required();

// POST e PUT: name e slug obrigatórios; use_in_menu opcional.
// (Sem UNIQUE e sem formato de slug: o README não exige.)
const bodySchema = Joi.object({
  name: requiredText,
  slug: requiredText,
  use_in_menu: Joi.boolean().messages({ 'boolean.base': 'use_in_menu deve ser true ou false' }),
});

module.exports = {
  CATEGORY_FIELDS,
  searchQuerySchema,
  createSchema: bodySchema,
  updateSchema: bodySchema,
};
