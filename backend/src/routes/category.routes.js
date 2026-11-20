const { Router } = require('express');
const controller = require('../controllers/category.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { idParamSchema } = require('../validators/common.validator');
const { searchQuerySchema, createSchema, updateSchema } = require('../validators/category.validator');

const router = Router();

// Públicas. /search vem antes de /:id para não ser confundida com um id.
router.get('/search', validate({ query: searchQuerySchema }), controller.search);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);

// Protegidas por token (qualquer usuário autenticado; o README não prevê papéis).
// Ordem: token -> id da URL -> corpo -> existência (404).
router.post('/', requireAuth, validate({ body: createSchema }), controller.create);
router.put('/:id', requireAuth, validate({ params: idParamSchema, body: updateSchema }), controller.update);
router.delete('/:id', requireAuth, validate({ params: idParamSchema }), controller.remove);

module.exports = router;
