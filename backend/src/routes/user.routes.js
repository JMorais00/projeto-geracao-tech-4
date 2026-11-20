const { Router } = require('express');
const controller = require('../controllers/user.controller');
const { validate } = require('../middleware/validate');
const { requireAuth, requireSelf } = require('../middleware/auth');
const {
  registerSchema,
  updateSchema,
  loginSchema,
  idParamSchema,
} = require('../validators/user.validator');

const router = Router();

// Públicas (exceção à regra "todo POST exige token": sem elas ninguém conseguiria se cadastrar ou entrar)
router.post('/', validate({ body: registerSchema }), controller.create);
router.post('/token', validate({ body: loginSchema }), controller.token);

// Pública, como no README
router.get('/:id', validate({ params: idParamSchema }), controller.getById);

// Protegidas: token -> id válido -> só o próprio usuário (403) -> corpo válido
router.put(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  requireSelf,
  validate({ body: updateSchema }),
  controller.update,
);
router.delete('/:id', requireAuth, validate({ params: idParamSchema }), requireSelf, controller.remove);

module.exports = router;
