// Tabela de ligação entre produtos e categorias (N para N).
// Chave primária composta (product_id, category_id): sem coluna id.
module.exports = (sequelize, DataTypes) => {
  const ProductCategory = sequelize.define(
    'ProductCategory',
    {
      product_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      category_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    },
    {
      tableName: 'product_categories',
      timestamps: false,
    },
  );

  return ProductCategory;
};
