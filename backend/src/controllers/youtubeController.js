const { google } = require('googleapis');

// Lấy YouTube Channel ID từ biến môi trường
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCxxxxxxxxxxxxxxxxxx';

const buildYoutubeClient = (access_token) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token });

  return google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });
};

const resolveChannelIdFromVideo = async (youtube, videoId) => {
  const response = await youtube.videos.list({
    part: 'snippet',
    id: videoId,
    maxResults: 1,
  });

  const channelId = response?.data?.items?.[0]?.snippet?.channelId;
  return channelId || null;
};

/**
 * KIỂM TRA SUBSCRIPTION - Hàm kiểm tra xem user có theo dõi channel không
 * 
 * Cách hoạt động:
 * 1. Nhận access_token từ frontend (được lấy từ Google Login)
 * 2. Sử dụng access_token để tạo kết nối với YouTube API
 * 3. Gọi subscriptions.list() để kiểm tra xem user có subscribe không
 * 4. Trả về kết quả { isSubscribed: true/false }
 */
exports.checkSubscription = async (req, res) => {
  try {
    // Lấy access_token từ body của request
    const { access_token, channel_id, video_id } = req.body;

    // Kiểm tra access_token có tồn tại không
    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
        isSubscribed: false,
      });
    }

    const youtube = buildYoutubeClient(access_token);

    let targetChannelId = channel_id || null;

    if (!targetChannelId && video_id) {
      targetChannelId = await resolveChannelIdFromVideo(youtube, video_id);

      if (!targetChannelId) {
        return res.status(404).json({
          success: false,
          message: 'Cannot resolve channel from provided video_id',
          isSubscribed: false,
        });
      }
    }

    if (!targetChannelId) {
      targetChannelId = YOUTUBE_CHANNEL_ID;
    }

    // Gọi API YouTube để lấy danh sách subscriptions
    // forChannelId: kiểm tra xem user có subscribe channel nào không
    // Nếu user subscribe channel YOUTUBE_CHANNEL_ID thì sẽ có trong response
    const response = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true, // Lấy subscriptions của user đang đăng nhập
      forChannelId: targetChannelId, // Tìm subscription cho channel này
      maxResults: 1, // Chỉ cần 1 kết quả
    });

    // Kiểm tra xem subscription có tồn tại không
    // Nếu items.length > 0 = user đã subscribe
    const isSubscribed = response.data.items && response.data.items.length > 0;

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      isSubscribed,
      channelId: targetChannelId,
      message: isSubscribed 
        ? 'User is subscribed' 
        : 'User is not subscribed',
    });

  } catch (error) {
    // Xử lý lỗi
    console.error('Error checking subscription:', error.message);

    // Nếu access_token hết hạn hoặc không hợp lệ
    if (error.message.includes('invalid_grant') || error.message.includes('invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
        isSubscribed: false,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error checking subscription',
      isSubscribed: false,
      error: error.message,
    });
  }
};

/**
 * SUBSCRIBE CHANNEL - Đăng ký channel YouTube bằng subscriptions.insert
 *
 * Request body:
 * - access_token: Google OAuth access token có scope youtube.force-ssl
 * - channel_id (optional): channel cần subscribe, mặc định dùng YOUTUBE_CHANNEL_ID
 */
exports.subscribeChannel = async (req, res) => {
  // Declare targetChannelId in function scope so catch block can reference it
  let targetChannelId = null;

  try {
    const { access_token, channel_id, video_id } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const youtube = buildYoutubeClient(access_token);
    targetChannelId = channel_id || null;

    if (!targetChannelId && video_id) {
      targetChannelId = await resolveChannelIdFromVideo(youtube, video_id);

      if (!targetChannelId) {
        return res.status(404).json({
          success: false,
          message: 'Cannot resolve channel from provided video_id',
        });
      }
    }

    if (!targetChannelId) {
      targetChannelId = YOUTUBE_CHANNEL_ID;
    }

    if (!targetChannelId) {
      return res.status(400).json({
        success: false,
        message: 'channel_id or video_id is required',
      });
    }

    const response = await youtube.subscriptions.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: targetChannelId,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Subscribed channel successfully',
      data: {
        subscriptionId: response?.data?.id,
        channelId: targetChannelId,
      },
    });
  } catch (error) {
    const errorMessage = error?.message || '';
    const apiReason = error?.errors?.[0]?.reason || error?.response?.data?.error?.errors?.[0]?.reason;
    const httpStatus = Number(error?.code || error?.response?.status || 500);

    console.error('Error subscribing channel:', errorMessage);

    if (errorMessage.includes('invalid_grant') || httpStatus === 401) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
      });
    }

    if (apiReason === 'subscriptionDuplicate') {
      return res.status(409).json({
        success: true,
        message: 'Already subscribed',
        data: {
          channelId: targetChannelId,
          alreadySubscribed: true,
        },
      });
    }

    if (httpStatus === 403 || apiReason === 'insufficientPermissions') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient YouTube permission. Please login with youtube.force-ssl scope.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error subscribing channel',
      error: errorMessage,
    });
  }
};

/**
 * LẤY THÔNG TIN CHANNEL - Hàm lấy thông tin chi tiết của channel YouTube
 * (Tuỳ chọn - để hiển thị thông tin channel trong component)
 */
exports.getChannelInfo = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const youtube = buildYoutubeClient(access_token);

    // Lấy thông tin về channel đích
    const response = await youtube.channels.list({
      part: 'snippet,statistics',
      id: YOUTUBE_CHANNEL_ID,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const channelData = response.data.items[0];

    return res.status(200).json({
      success: true,
      channelName: channelData.snippet.title,
      channelDescription: channelData.snippet.description,
      channelThumbnail: channelData.snippet.thumbnails.default.url,
      subscriberCount: channelData.statistics.subscriberCount,
      videoCount: channelData.statistics.videoCount,
      channelUrl: `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`,
    });

  } catch (error) {
    console.error('Error getting channel info:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error getting channel information',
      error: error.message,
    });
  }
};
