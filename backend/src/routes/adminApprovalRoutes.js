const express = require('express');
const adminApprovalController = require('../controllers/adminApprovalController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get(
  '/pending',
  authenticate,
  authorize('admin'),
  adminApprovalController.getPendingApprovals,
);

router.put(
  '/:type/:id/status',
  authenticate,
  authorize('admin'),
  adminApprovalController.updateApprovalStatus,
);

module.exports = router;