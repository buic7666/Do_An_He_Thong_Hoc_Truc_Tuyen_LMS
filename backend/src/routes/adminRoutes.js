const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboardOverview);

module.exports = router;
