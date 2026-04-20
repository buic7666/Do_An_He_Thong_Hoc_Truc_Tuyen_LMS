const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { registerBodySchema, loginBodySchema } = require('../validations/authValidation');

const router = express.Router();

router.post('/register', validateRequest({ body: registerBodySchema }), authController.register);
router.post('/login', validateRequest({ body: loginBodySchema }), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;