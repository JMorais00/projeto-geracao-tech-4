const { Category } = require('../models');
const { notFound } = require('../utils/AppError');

// Campos públicos (sem created_at / updated_at)
const PUBLIC_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const toPublic = (category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  use_in_menu: category.use_in_menu,
});

// limit = -1 devolve todos (page é ignorado e informado como 1).
// Ordenado por id para a paginação ser estável.
async function search({ limit, page, use_in_menu: useInMenu, fields }) {
  const where = {};
  if (useInMenu !== undefined) where.use_in_menu = useInMenu;

  const options = { where, attributes: fields || PUBLIC_FIELDS, order: [['id', 'ASC']] };
  const all = limit === -1;
  if (!all) {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }

  const { rows, count } = await Category.findAndCountAll(options);

  return {
    data: rows.map((row) => row.get({ plain: true })),
    total: count,
    limit,
    page: all ? 1 : page,
  };
}

async function getById(id) {
  const category = await Category.findByPk(id, { attributes: PUBLIC_FIELDS });
  if (!category) throw notFound('Categoria não encontrada');
  return toPublic(category);
}

async function create({ name, slug, use_in_menu: useInMenu }) {
  const data = { name, slug };
  if (useInMenu !== undefined) data.use_in_menu = useInMenu; // senão vale o padrão do banco (false)
  const category = await Category.create(data);
  return toPublic(category);
}

// Atualiza só name, slug e (se enviado) use_in_menu; sem use_in_menu o valor atual é mantido.
async function update(id, { name, slug, use_in_menu: useInMenu }) {
  const category = await Category.findByPk(id);
  if (!category) throw notFound('Categoria não encontrada');

  const changes = { name, slug };
  if (useInMenu !== undefined) changes.use_in_menu = useInMenu;
  await category.update(changes, { fields: Object.keys(changes) });
}

// Os vínculos com produtos são removidos pelo ON DELETE CASCADE do banco; os produtos permanecem.
async function remove(id) {
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) throw notFound('Categoria não encontrada');
}

module.exports = { search, getById, create, update, remove };
