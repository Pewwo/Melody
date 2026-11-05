import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { App } from './App';
import { PlayerProvider } from './context/PlayerContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <PlayerProvider>
        <App />
      </PlayerProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// Register Service Worker for background audio + offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[Melody SW] Registered:', reg.scope);

      // Keep-alive ping every 20 seconds so the SW stays active during lock-screen playback
      const ping = () => {
        if (reg.active) {
          const channel = new MessageChannel();
          reg.active.postMessage({ type: 'KEEP_ALIVE' }, [channel.port2]);
        }
      };
      setInterval(ping, 20_000);
    } catch (err) {
      console.warn('[Melody SW] Registration failed:', err);
    }
  });
}
