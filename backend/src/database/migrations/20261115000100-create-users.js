'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      firstname: { type: Sequelize.STRING, allowNull: false },
      surname: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      // guarda o hash gerado pelo bcrypt (nunca a senha em texto)
      password: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // e-mail único: é o identificador usado no login (POST /v1/user/token)
    await queryInterface.addIndex('users', ['email'], { name: 'uq_users_email', unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
