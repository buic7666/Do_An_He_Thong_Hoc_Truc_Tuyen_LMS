const express = require('express');

const contactController = require('../controllers/contactController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { createContactMessageBodySchema } = require('../validations/contactValidation');

const router = express.Router();

router.post('/', validateRequest({ body: createContactMessageBodySchema }), contactController.submitContactMessage);
router.get('/', authenticate, authorize('admin'), contactController.getContactMessages);

module.exports = router;
