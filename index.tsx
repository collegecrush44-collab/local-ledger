
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 1. Request Storage Persistence to prevent OS data eviction
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log("Storage will not be cleared except by explicit user action.");
    } else {
      console.warn("Storage may be cleared by the OS under disk pressure.");
    }
  });
}

// 2. Advanced Service Worker Registration for Offline & Updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Force the Service Worker URL to resolve on the current origin to avoid mismatch
    // 'ai.studio' origin mismatch errors are common in proxied preview windows.
    try {
      const swUrl = (window.location.origin + window.location.pathname).replace(/\/[^\/]*$/, '/sw.js');
      
      navigator.serviceWorker.register(swUrl).then(reg => {
        // Check for updates periodically
        reg.update();

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  window.dispatchEvent(new CustomEvent('sw-update-available', { detail: reg }));
                }
              }
            };
          }
        };
      }).catch(err => {
        // Silently log origin errors in dev environments where SWs are blocked
        if (err.message.includes('origin')) {
          console.warn('SW registration skipped: Origin mismatch (common in sandboxes)');
        } else {
          console.error('SW registration failed:', err);
        }
      });
    } catch (e) {
      console.warn('SW registration aborted due to URL construction failure.');
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
