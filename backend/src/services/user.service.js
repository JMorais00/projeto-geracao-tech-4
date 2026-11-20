const { User } = require('../models');
const authService = require('./auth.service');
const { badRequest, notFound } = require('../utils/AppError');

// Só estes campos saem da API (nunca password).
const toPublic = (user) => ({
  id: user.id,
  firstname: user.firstname,
  surname: user.surname,
  email: user.email,
});

async function assertEmailAvailable(email, ignoreUserId) {
  const existing = await User.findOne({ where: { email }, attributes: ['id'] });
  if (existing && existing.id !== ignoreUserId) {
    throw badRequest('Dados da requisição inválidos', [
      { field: 'email', message: 'E-mail já cadastrado' },
    ]);
  }
}

async function create({ firstname, surname, email, password }) {
  await assertEmailAvailable(email);
  const hash = await authService.hashPassword(password);
  // Em corrida (dois cadastros simultâneos) o índice único do banco recusa o segundo;
  // o errorHandler converte esse erro em 400.
  const user = await User.create({ firstname, surname, email, password: hash });
  return toPublic(user);
}

async function getById(id) {
  const user = await User.findByPk(id);
  if (!user) throw notFound('Usuário não encontrado');
  return toPublic(user);
}

// Atualiza SOMENTE nome, sobrenome e e-mail (a senha nunca é alterada aqui).
async function update(id, { firstname, surname, email }) {
  const user = await User.findByPk(id);
  if (!user) throw notFound('Usuário não encontrado');
  await assertEmailAvailable(email, user.id);
  await user.update({ firstname, surname, email }, { fields: ['firstname', 'surname', 'email'] });
}

async function remove(id) {
  const deleted = await User.destroy({ where: { id } });
  if (!deleted) throw notFound('Usuário não encontrado');
}

module.exports = { create, getById, update, remove };
