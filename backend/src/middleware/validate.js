const { badRequest } = require('../utils/AppError');

// Mensagens em português. Nenhuma inclui o VALOR enviado (para não vazar senhas).
const MESSAGES = {
  'any.required': '{#label} é obrigatório',
  'any.only': '{#label} é inválido',
  'any.invalid': '{#label} é inválido',
  'string.base': '{#label} deve ser um texto',
  'string.empty': '{#label} não pode ser vazio',
  'string.min': '{#label} deve ter no mínimo {#limit} caracteres',
  'string.max': '{#label} deve ter no máximo {#limit} caracteres',
  'string.email': '{#label} deve ser um e-mail válido',
  'string.pattern.base': '{#label} está em formato inválido',
  'object.base': 'O corpo da requisição deve ser um objeto JSON',
  'object.unknown': '{#label} não é um campo permitido',
};

const OPTIONS = {
  abortEarly: false,
  allowUnknown: false, // campos desconhecidos geram 400
  stripUnknown: false,
  convert: true,
  errors: { wrap: { label: false } },
  messages: MESSAGES,
};

// validate({ params, query, body }) -> grava os valores já validados em req.validated
function validate(schemas) {
  return (req, res, next) => {
    req.validated = req.validated || {};

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const input = req[part] === undefined ? {} : req[part];
      const { error, value } = schema.validate(input, OPTIONS);

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.length ? detail.path.join('.') : undefined,
          message: detail.message,
        }));
        return next(badRequest('Dados da requisição inválidos', details));
      }
      req.validated[part] = value;
    }

    return next();
  };
}

module.exports = { validate, MESSAGES, OPTIONS };
