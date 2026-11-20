const { Router } = require('express');
const controller = require('../controllers/product.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { idParamSchema, createSchema, updateSchema, searchSchema } = require('../validators/product.validator');

const router = Router();

// Consultas públicas.
router.get('/search', validate({ query: searchSchema }), controller.search);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);

// Cadastro, atualização e exclusão exigem autenticação JWT.
router.post('/', requireAuth, validate({ body: createSchema }), controller.create);
router.put('/:id', requireAuth, validate({ params: idParamSchema }), validate({ body: updateSchema }), controller.update);
router.delete('/:id', requireAuth, validate({ params: idParamSchema }), controller.remove);

module.exports = router;
