// A coluna do banco se chama "values" (palavra reservada do MySQL). No model o atributo
// é "option_values" (mapeado para a coluna "values"). Na saída JSON o campo volta a se
// chamar "values", como no README, em formato de lista (ex.: ["39","40","41"]).

function normalizeValues(value) {
  const list = Array.isArray(value) ? value : String(value == null ? '' : value).split(',');
  return list
    .map((item) => String(item).trim())
    .filter((item) => item !== '')
    .join(',');
}

function splitValues(stored) {
  if (stored == null || stored === '') return [];
  return String(stored).split(',');
}

module.exports = (sequelize, DataTypes) => {
  const ProductOption = sequelize.define(
    'ProductOption',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      shape: {
        type: DataTypes.ENUM('square', 'circle'),
        allowNull: false,
        defaultValue: 'square',
        validate: { isIn: [['square', 'circle']] },
      },
      radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { isInt: true, min: 0 },
      },
      type: {
        type: DataTypes.ENUM('text', 'color'),
        allowNull: false,
        defaultValue: 'text',
        validate: { isIn: [['text', 'color']] },
      },
      option_values: {
        type: DataTypes.STRING,
        field: 'values',
        allowNull: false,
        validate: { notEmpty: true },
        // aceita lista (["39","40"]) ou texto ("39,40") e grava sem espaços: "39,40"
        set(value) {
          this.setDataValue('option_values', normalizeValues(value));
        },
      },
    },
    {
      tableName: 'product_options',
      timestamps: false, // o README não pede created_at/updated_at aqui
    },
  );

  ProductOption.associate = (models) => {
    ProductOption.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  ProductOption.prototype.toJSON = function toJSON() {
    const { option_values: optionValues, ...rest } = this.get();
    const json = { ...rest };
    if (optionValues !== undefined) json.values = splitValues(optionValues);
    return json;
  };

  return ProductOption;
};
