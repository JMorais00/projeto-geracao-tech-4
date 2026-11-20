'use strict';

// Campos adicionais aprovados (não substituem nenhum requisito do README).
// Todos opcionais: ficam NULL quando não há dado (nada é inventado).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'brand', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('products', 'reference', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('products', 'rating', { type: Sequelize.FLOAT, allowNull: true });
    await queryInterface.addColumn('products', 'reviews_count', { type: Sequelize.INTEGER, allowNull: true });

    await queryInterface.addIndex('products', ['brand'], { name: 'idx_products_brand' });
  },

  // Só executado se você pedir explicitamente o undo; remove apenas estas 4 colunas.
  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'idx_products_brand');
    await queryInterface.removeColumn('products', 'reviews_count');
    await queryInterface.removeColumn('products', 'rating');
    await queryInterface.removeColumn('products', 'reference');
    await queryInterface.removeColumn('products', 'brand');
  },
};
