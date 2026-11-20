module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      slug: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { isInt: true, min: 0 },
      },
      description: { type: DataTypes.STRING(1000), allowNull: true },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { isFloat: true, min: 0 },
      },
      // 0 = sem desconto. (A regra "desconto <= preço" será validada na Etapa 6.)
      price_with_discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: { isFloat: true, min: 0 },
      },

      // Campos adicionais aprovados, todos opcionais (NULL quando não há dado)
      brand: { type: DataTypes.STRING, allowNull: true },
      reference: { type: DataTypes.STRING, allowNull: true },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: { isFloat: true, min: 0, max: 5 },
      },
      reviews_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { isInt: true, min: 0 },
      },
    },
    {
      tableName: 'products',
      timestamps: true,
    },
  );

  Product.associate = (models) => {
    Product.hasMany(models.ProductImage, {
      foreignKey: 'product_id',
      as: 'images',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Product.hasMany(models.ProductOption, {
      foreignKey: 'product_id',
      as: 'options',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Product.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: 'product_id',
      otherKey: 'category_id',
      as: 'categories',
    });
  };

  // O toJSON padrão do Sequelize não chama o toJSON dos itens incluídos (include).
  // Aqui garantimos que as opções saiam com o campo "values" também dentro do produto.
  Product.prototype.toJSON = function toJSON() {
    const json = this.get({ plain: true });
    const { options } = this.dataValues;
    if (Array.isArray(options)) {
      json.options = options.map((option) => option.toJSON());
    }
    return json;
  };

  return Product;
};
