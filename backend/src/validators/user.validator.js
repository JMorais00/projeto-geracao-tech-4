const Joi = require('joi');
const { idParamSchema } = require('./common.validator'); // definido em arquivo comum e reexportado abaixo

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_BYTES = 72; // limite real do bcrypt: o que passar disso seria ignorado

const name = Joi.string().trim().min(1).max(255).required();

const email = Joi.string()
  .trim()
  .lowercase()
  .max(255)
  .email({ tlds: { allow: false } })
  .required();

// A senha NÃO é "trimada": espaços fazem parte dela.
const password = Joi.string()
  .min(MIN_PASSWORD_LENGTH)
  .required()
  .custom((value, helpers) => {
    if (Buffer.byteLength(value, 'utf8') > MAX_PASSWORD_BYTES) {
      return helpers.error('password.maxBytes');
    }
    return value;
  }, 'limite de bytes do bcrypt')
  .messages({ 'password.maxBytes': `{#label} deve ter no máximo ${MAX_PASSWORD_BYTES} bytes` });

const confirmPassword = Joi.any()
  .valid(Joi.ref('password'))
  .required()
  .messages({
    'any.only': 'confirmPassword deve ser igual a password',
    'any.required': 'confirmPassword é obrigatório',
  });

// POST /v1/user
const registerSchema = Joi.object({
  firstname: name,
  surname: name,
  email,
  password,
  confirmPassword,
});

// PUT /v1/user/:id  (sem password: o README não prevê troca de senha)
const updateSchema = Joi.object({
  firstname: name,
  surname: name,
  email,
});

// POST /v1/user/token
const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
});

module.exports = { registerSchema, updateSchema, loginSchema, idParamSchema };
