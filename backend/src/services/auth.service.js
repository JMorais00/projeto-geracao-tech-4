const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  JWT_ALGORITHM,
  getJwtSecret,
  getJwtExpiresIn,
  getBcryptRounds,
} = require('../config/auth');
const { badRequest } = require('../utils/AppError');

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, getBcryptRounds());
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

// O token leva apenas id e e-mail (nunca senha ou hash).
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: getJwtExpiresIn(),
  });
}

// Fixa o algoritmo para recusar tokens "alg: none" ou assinados de outra forma.
function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] });
}

// Hash "falso" usado quando o e-mail não existe, para que o tempo de resposta
// não revele se o e-mail está cadastrado.
const dummyHash = { rounds: null, promise: null };
function getDummyHash() {
  const rounds = getBcryptRounds();
  if (dummyHash.rounds !== rounds) {
    dummyHash.rounds = rounds;
    dummyHash.promise = bcrypt.hash('senha-inexistente-apenas-para-igualar-o-tempo', rounds);
  }
  return dummyHash.promise;
}

async function login({ email, password }) {
  const { User } = require('../models'); // importado aqui para manter este módulo leve nos testes unitários
  const user = await User.scope('withPassword').findOne({ where: { email } });

  const hash = user ? user.password : await getDummyHash();
  const passwordMatches = await comparePassword(password, hash);

  // mesma mensagem para e-mail inexistente e senha errada
  if (!user || !passwordMatches) throw badRequest('E-mail ou senha inválidos');

  return { token: generateToken(user) };
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken, login };
