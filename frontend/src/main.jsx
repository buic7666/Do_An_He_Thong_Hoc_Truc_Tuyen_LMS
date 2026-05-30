import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';

import App from './App';
import './index.css';

// CLIENT_ID của bạn từ Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Dev helper: allow populating `sessionStorage.accessToken` from
// localStorage.devAccessToken when running in development. This lets
// you set a persistent token in Application->Local Storage for quick testing.
if (import.meta.env.DEV) {
  try {
    const devToken = localStorage.getItem('devAccessToken');
    const devUser = localStorage.getItem('devCurrentUser');
    if (devToken) {
      sessionStorage.setItem('accessToken', devToken);
      console.info('[dev] applied devAccessToken to sessionStorage');
    }
    if (devUser) {
      sessionStorage.setItem('currentUser', devUser);
      console.info('[dev] applied devCurrentUser to sessionStorage');
    }
  } catch (e) {
    // ignore
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);