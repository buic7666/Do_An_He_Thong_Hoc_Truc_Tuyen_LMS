const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const {
	registerBodySchema,
	loginBodySchema,
	googleSocialBodySchema,
	facebookSocialBodySchema,
} = require('../validations/authValidation');

const router = express.Router();

router.post('/register', validateRequest({ body: registerBodySchema }), authController.register);
router.post('/login', validateRequest({ body: loginBodySchema }), authController.login);
router.post('/social/google', validateRequest({ body: googleSocialBodySchema }), authController.loginWithGoogle);
router.post('/social/facebook', validateRequest({ body: facebookSocialBodySchema }), authController.loginWithFacebook);
router.get('/me', authenticate, authController.me);

module.exports = router;