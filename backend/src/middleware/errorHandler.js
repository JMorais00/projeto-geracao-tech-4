const { AppError } = require("../utils/AppError");
const { redactSecrets } = require("../utils/redact");

function notFound(req, res) {
  res.status(404).json({ message: "Rota não encontrada" });
}

function toFieldErrors(err, message) {
  return (err.errors || []).map((item) => ({
    field: item.path || undefined,
    message,
  }));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Erros esperados, com status e mensagem seguros
  if (err instanceof AppError) {
    const body = { message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.status).json(body);
  }

  // JSON malformado no corpo da requisição
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "JSON inválido no corpo da requisição" });
  }
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ message: "O corpo da requisição excede o limite permitido" });
  }

  // Erros do Sequelize que representam dados incorretos do cliente
  if (err.name === "SequelizeUniqueConstraintError") {
    return res
      .status(400)
      .json({
        message: "Dados da requisição inválidos",
        errors: toFieldErrors(err, "Valor já cadastrado"),
      });
  }
  if (err.name === "SequelizeValidationError") {
    return res
      .status(400)
      .json({
        message: "Dados da requisição inválidos",
        errors: toFieldErrors(err, "Valor inválido"),
      });
  }
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({ message: "Dados da requisição inválidos" });
  }

  // Inesperado: o cliente recebe uma mensagem genérica; o log registra só a pilha, sem segredos
  // (não registramos o objeto do erro inteiro: ele pode carregar o SQL com valores).
  if (process.env.NODE_ENV !== "test")
    console.error(redactSecrets(err && err.stack ? err.stack : err));
  return res.status(500).json({ message: "Erro interno do servidor" });
}

module.exports = { notFound, errorHandler };
