import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import ReactPlayer from 'react-player';
import httpClient from '../api/httpClient';

/**
 * ========================================
 * COMPONENT: VideoGuard
 * ========================================
 * 
 * Mục đích: Khi user bấm xem video, hệ thống sẽ gọi backend để subscribe kênh YouTube
 * thông qua YouTube Data API v3 trước khi mở video.
 * 
 * Cách hoạt động:
 * 1. User nhấp "Đăng nhập bằng Google"
 * 2. Google OAuth trả về access_token
 * 3. Khi bấm "Xem video", gửi access_token tới backend /api/youtube/subscribe
 * 4. Backend gọi subscriptions.insert để subscribe channel
 * 5. Thành công thì mở video, lỗi thì hiển thị thông báo
 * 
 * Props:
 * - youtubeUrl: URL video YouTube cần bảo vệ (bắt buộc)
 * - channelId: ID channel YouTube (bắt buộc)
 * - title: Tiêu đề video (tuỳ chọn)
 */
const VideoGuard = ({ youtubeUrl, channelId = 'UCxxxxxxxxxxxxxxxxxx', title = 'Video Bài Học' }) => {
  // ===== STATE MANAGEMENT =====
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isVideoUnlocked, setIsVideoUnlocked] = useState(false);

  const getVideoId = (rawUrl) => {
    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace('www.', '');

      if (host === 'youtu.be') {
        const id = url.pathname.slice(1).split(/[?&#/]/)[0];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') {
          const id = (url.searchParams.get('v') || '').trim();
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
        }

        if (url.pathname.startsWith('/embed/')) {
          const id = url.pathname.split('/embed/')[1]?.split(/[?&#/]/)[0] || '';
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
        }

        if (url.pathname.startsWith('/shorts/')) {
          const id = url.pathname.split('/shorts/')[1]?.split(/[?&#/]/)[0] || '';
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
        }
      }
    } catch (_error) {
      return null;
    }

    return null;
  };

  const showMessage = (type, message) => {
    setStatusType(type);
    setStatusMessage(message);
  };

  /**
   * HÀM: Gọi backend để subscribe channel qua YouTube Data API v3.
   */
  const handleSubscribe = async () => {
    if (!accessToken) {
      showMessage('error', 'Bạn cần đăng nhập Google trước khi xem video.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('');

    try {
      const resolvedVideoId = getVideoId(youtubeUrl);
      const hasCustomChannelId = Boolean(channelId) && !String(channelId).includes('xxxxxxxx');
      const response = await httpClient.post('/youtube/subscribe', {
        access_token: accessToken,
        ...(hasCustomChannelId ? { channel_id: channelId } : {}),
        ...(resolvedVideoId ? { video_id: resolvedVideoId } : {}),
      });

      const payload = response?.data?.data || response?.data;
      const success = Boolean(payload?.success ?? payload?.isSubscribed ?? true);

      if (success) {
        setIsVideoUnlocked(true);
        showMessage('success', payload?.message || 'Đăng ký kênh thành công. Đang mở video...');
        return;
      }

      showMessage('error', payload?.message || 'Không thể đăng ký kênh YouTube.');
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const status = Number(error?.response?.status || 0);

      if (status === 401) {
        showMessage('error', 'Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập Google lại.');
      } else if (status === 403) {
        showMessage('error', 'Bạn chưa cấp quyền YouTube. Vui lòng đăng nhập lại và cấp quyền.');
      } else if (status === 409) {
        setIsVideoUnlocked(true);
        showMessage('success', 'Bạn đã subscribe kênh trước đó. Đang mở video...');
      } else {
        showMessage('error', backendMessage || 'Có lỗi xảy ra khi đăng ký kênh YouTube.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * GOOGLE LOGIN HANDLER
   * 
   * @react-oauth/google hook tự động gọi callback này
   * Nhận lại credential object chứa access_token
   */
  const login = useGoogleLogin({
    // Scope bắt buộc để subscribe qua YouTube Data API
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/youtube.force-ssl'].join(' '),
    prompt: 'consent',
    
    // onSuccess: Callback khi đăng nhập thành công
    onSuccess: async (codeResponse) => {
      // codeResponse.access_token = token để gọi YouTube API
      setAccessToken(codeResponse.access_token || '');
      showMessage('success', 'Đăng nhập Google thành công. Bấm "Xem video" để hệ thống đăng ký kênh.');
    },
    
    // onError: Callback khi đăng nhập thất bại
    onError: () => {
      showMessage('error', 'Lỗi đăng nhập với Google');
    },
  });

  /**
   * GIAO DIỆN - Trạng thái ĐANG TẢI
   */
  if (isLoading) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-4 text-gray-700 font-medium">
          🔄 Đang xử lý subscribe kênh YouTube...
        </p>
      </div>
    );
  }

  if (isVideoUnlocked) {
    return (
      <div className="video-container bg-black rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 font-semibold">
          ✅ {statusMessage || 'Đã mở khóa video'}
        </div>
        <div style={{ paddingBottom: '56.25%', position: 'relative', overflow: 'hidden' }}>
          <ReactPlayer
            url={youtubeUrl}
            width="100%"
            height="100%"
            controls
            playing={false}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-blue-50 p-8 rounded-lg text-center border-2 border-gray-300">
      <div className="text-5xl mb-4">🎥</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-600 mb-6 text-lg">
        Nhấn đăng nhập Google và bấm xem video để hệ thống tự động đăng ký kênh YouTube.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
        <button
          onClick={() => login()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
        >
          Đăng nhập Google
        </button>

        <button
          onClick={handleSubscribe}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          disabled={isLoading}
        >
          Xem video
        </button>
      </div>

      <a
        href={`https://www.youtube.com/channel/${channelId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-700 underline"
      >
        Mở kênh YouTube
      </a>

      {statusMessage && (
        <div
          className={`mt-4 px-4 py-2 rounded ${
            statusType === 'success'
              ? 'bg-green-100 border border-green-300 text-green-700'
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <button
        onClick={() => setIsVideoUnlocked(false)}
        type="button"
        className="mt-4 text-sm text-gray-600 underline"
      >
        Đặt lại trạng thái demo
      </button>
    </div>
  );
};

export default VideoGuard;
