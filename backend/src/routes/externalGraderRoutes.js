const express = require('express');
const router = express.Router();
const { webhookHandler } = require('../controllers/externalGraderController');

// Public webhook endpoint (no auth) — verify via signature if configured
router.post('/webhook', express.json(), webhookHandler);

module.exports = router;
