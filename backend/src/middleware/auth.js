const authService = require('../services/auth.service');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest, unauthorized, forbidden } = require('../utils/AppError');

const BEARER_HEADER = /^Bearer\s+(\S+)$/i;
const JWT_ERRORS = new Set(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError']);

// Regras (decisão do projeto; diverge do README, que cita 400 e 401 para token ausente):
//   sem cabeçalho Authorization ................ 401
//   cabeçalho fora do formato "Bearer <token>" .. 400
//   token inválido, adulterado ou expirado ...... 401
//   usuário do token não existe mais ............ 401
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header === undefined || header === '') {
    throw unauthorized('Token de autorização não enviado');
  }

  const match = BEARER_HEADER.exec(header);
  if (!match) {
    throw badRequest('Cabeçalho Authorization malformado. Use: Authorization: Bearer <token>');
  }

  let payload;
  try {
    payload = authService.verifyToken(match[1]);
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw unauthorized('Token expirado');
    if (JWT_ERRORS.has(error.name)) throw unauthorized('Token inválido');
    throw error; // problema de configuração (ex.: JWT_SECRET ausente) vira 500
  }

  const id = payload && payload.id;
  if (!Number.isInteger(id) || id < 1) throw unauthorized('Token inválido');

  const user = await User.findByPk(id);
  if (!user) throw unauthorized('O usuário deste token não existe mais');

  req.auth = { id: user.id, email: user.email };
  next();
});

// Só o próprio usuário pode alterar/excluir a sua conta. Usar depois de requireAuth e validate({ params }).
function requireSelf(req, res, next) {
  if (req.validated.params.id !== req.auth.id) {
    return next(forbidden('Você só pode acessar ou modificar a sua própria conta'));
  }
  return next();
}

module.exports = { requireAuth, requireSelf };
