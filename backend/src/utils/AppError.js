// Erro "esperado" da aplicação, com status HTTP e mensagem segura para o cliente.
class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    if (errors) this.errors = errors; // lista { field, message } em erros de validação
    Error.captureStackTrace(this, this.constructor);
  }
}

const badRequest = (message = 'Dados da requisição inválidos', errors) => new AppError(400, message, errors);
const unauthorized = (message = 'Não autorizado') => new AppError(401, message);
const forbidden = (message = 'Acesso negado') => new AppError(403, message);
const notFound = (message = 'Recurso não encontrado') => new AppError(404, message);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound };
