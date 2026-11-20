'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      // STRING(1000): continua sendo STRING; evita truncar descrições longas
      description: { type: Sequelize.STRING(1000), allowNull: true },
      price: { type: Sequelize.FLOAT, allowNull: false },
      // 0 significa "sem desconto"
      price_with_discount: { type: Sequelize.FLOAT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // índice comum (NÃO único), conforme decisão aprovada
    await queryInterface.addIndex('products', ['slug'], { name: 'idx_products_slug' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
