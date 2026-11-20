require('./env');

const JWT_ALGORITHM = 'HS256';

// Lidos no momento do uso (não na importação) para que testes possam ajustar o ambiente.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET não está definido. Preencha-o no arquivo .env (veja o README).');
  }
  return secret;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '1h';
}

// Custo do bcrypt: BCRYPT_ROUNDS (4 a 15) se válido; senão 10 (4 nos testes, para ficarem rápidos).
function getBcryptRounds() {
  const configured = Number(process.env.BCRYPT_ROUNDS);
  if (Number.isInteger(configured) && configured >= 4 && configured <= 15) return configured;
  return process.env.NODE_ENV === 'test' ? 4 : 10;
}

module.exports = { JWT_ALGORITHM, getJwtSecret, getJwtExpiresIn, getBcryptRounds };
