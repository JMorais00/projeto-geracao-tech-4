module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define(
    'ProductImage',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // caminho relativo da imagem salva no servidor
      path: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    },
    {
      tableName: 'product_images',
      timestamps: false, // o README não pede created_at/updated_at aqui
    },
  );

  ProductImage.associate = (models) => {
    ProductImage.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return ProductImage;
};
