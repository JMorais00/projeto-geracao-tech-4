module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      surname: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, isEmail: true },
      },
      // Guarda o HASH do bcrypt. O hash é gerado no service (Etapa 3), não aqui.
      password: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    },
    {
      tableName: 'users',
      timestamps: true, // created_at / updated_at (underscored vem da config)
      // Por padrão as consultas NÃO trazem o hash da senha.
      defaultScope: { attributes: { exclude: ['password'] } },
      // Use User.scope('withPassword') apenas no login.
      scopes: { withPassword: {} },
    },
  );

  // Nunca serializa a senha em respostas JSON, mesmo logo após um create().
  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
