'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      // chave primária composta: impede o mesmo vínculo duplicado
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    // acelera o filtro por categoria (category_ids)
    await queryInterface.addIndex('product_categories', ['category_id'], {
      name: 'idx_product_categories_category_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  },
};
