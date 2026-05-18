const express = require('express');
const youtubeController = require('../controllers/youtubeController');

const router = express.Router();

/**
 * ROUTE 1: Kiểm tra subscription
 * POST /api/youtube/check-subscription
 * 
 * Request body: { access_token: "..." }
 * Response: { isSubscribed: true/false, message: "..." }
 */
router.post('/check-subscription', youtubeController.checkSubscription);

/**
 * ROUTE 1.5: Subscribe channel
 * POST /api/youtube/subscribe
 *
 * Request body: { access_token: "...", channel_id?: "..." }
 */
router.post('/subscribe', youtubeController.subscribeChannel);

/**
 * ROUTE 2: Lấy thông tin channel (tuỳ chọn)
 * POST /api/youtube/channel-info
 * 
 * Request body: { access_token: "..." }
 * Response: { channelName, subscriberCount, channelUrl, ... }
 */
router.post('/channel-info', youtubeController.getChannelInfo);

module.exports = router;
