const Joi = require('joi');

// :id da URL -> inteiro positivo (convertido para Number)
const idParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[1-9]\d{0,9}$/)
    .required()
    .custom((value, helpers) => {
      const id = Number(value);
      return id > 2147483647 ? helpers.error('any.invalid') : id;
    }, 'id inteiro'),
});

module.exports = { idParamSchema };
