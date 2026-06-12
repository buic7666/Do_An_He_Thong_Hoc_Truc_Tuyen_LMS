const FACEBOOK_MESSAGE_TYPE = 'facebook_oauth_token';

export const facebookCallbackPath = '/oauth/facebook/callback';

const buildFacebookDialogUrl = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  if (!appId || String(appId).startsWith('YOUR_')) {
    throw new Error('Thiếu VITE_FACEBOOK_APP_ID trong frontend/.env');
  }

  const redirectUri = `${window.location.origin}${facebookCallbackPath}`;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'email,public_profile',
  });

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
};

export const startFacebookLogin = () => {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      buildFacebookDialogUrl(),
      'facebook-oauth',
      'width=520,height=700,menubar=no,toolbar=no,status=no',
    );

    if (!popup) {
      reject(new Error('Trình duyệt đã chặn popup Facebook login'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Đăng nhập Facebook quá thời gian. Vui lòng thử lại.'));
    }, 120000);

    const closeWatcher = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Bạn đã đóng cửa sổ đăng nhập Facebook.'));
      }
    }, 500);

    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data || {};
      if (data.type !== FACEBOOK_MESSAGE_TYPE) {
        return;
      }

      cleanup();

      if (data.error) {
        reject(new Error(data.error));
        return;
      }

      if (!data.accessToken) {
        reject(new Error('Không lấy được access token từ Facebook.'));
        return;
      }

      resolve(data.accessToken);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(closeWatcher);
      window.removeEventListener('message', messageHandler);
    };

    window.addEventListener('message', messageHandler);
  });
};

export const parseFacebookTokenFromUrl = (href) => {
  const source = href || window.location.href;
  const hashIndex = source.indexOf('#');

  if (hashIndex < 0) {
    return { error: 'Facebook không trả về access token.' };
  }

  const fragment = source.slice(hashIndex + 1);
  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const errorReason = params.get('error_reason') || params.get('error_description') || params.get('error');

  if (!accessToken) {
    return { error: errorReason || 'Không lấy được access token từ Facebook.' };
  }

  return { accessToken };
};

export const FACEBOOK_OAUTH_MESSAGE_TYPE = FACEBOOK_MESSAGE_TYPE;
