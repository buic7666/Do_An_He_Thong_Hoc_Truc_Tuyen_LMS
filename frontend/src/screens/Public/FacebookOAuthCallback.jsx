import { useEffect, useMemo } from 'react';
import { FACEBOOK_OAUTH_MESSAGE_TYPE, parseFacebookTokenFromUrl } from '../../utils/facebookAuth';

function FacebookOAuthCallback() {
  const callbackResult = useMemo(() => parseFacebookTokenFromUrl(window.location.href), []);

  useEffect(() => {
    if (!window.opener) {
      return;
    }

    window.opener.postMessage(
      {
        type: FACEBOOK_OAUTH_MESSAGE_TYPE,
        accessToken: callbackResult.accessToken,
        error: callbackResult.error,
      },
      window.location.origin,
    );

    window.close();
  }, [callbackResult]);

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h2>Đang hoàn tất đăng nhập Facebook...</h2>
      {callbackResult.error ? (
        <p style={{ color: '#b91c1c' }}>{callbackResult.error}</p>
      ) : (
        <p>Bạn có thể đóng cửa sổ này.</p>
      )}
    </div>
  );
}

export default FacebookOAuthCallback;
