// Remove segredos de textos que vão para logs: hashes do bcrypt e campos de senha em JSON.
const BCRYPT_HASH = /\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}/g;
const PASSWORD_JSON_FIELD = /("(?:password|confirmPassword)"\s*:\s*)"(?:[^"\\]|\\.)*"/gi;

function redactSecrets(value) {
  return String(value)
    .replace(BCRYPT_HASH, '[hash-removido]')
    .replace(PASSWORD_JSON_FIELD, '$1"[removido]"');
}

module.exports = { redactSecrets };
