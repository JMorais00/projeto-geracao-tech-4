'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_options', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      shape: { type: Sequelize.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
      radius: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      type: { type: Sequelize.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
      // "values" é palavra reservada do MySQL; o Sequelize coloca aspas automaticamente.
      // Guarda todas as opções separadas por vírgula (ex.: "39,40,41").
      values: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.addIndex('product_options', ['product_id'], {
      name: 'idx_product_options_product_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_options');
  },
};
