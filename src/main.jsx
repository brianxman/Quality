/*
 * main.jsx  -  the entry point. This is the first file that runs.
 * It finds the <div id="root"> in index.html and tells React to draw <App/> there.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  // StrictMode adds extra development-time checks. It has no effect in the final build.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline support for the "installed web app" route.
// Only in production builds, and only over http(s): inside the native Capacitor
// wrapper the files are already on the device, so no service worker is needed.
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline caching is a bonus; ignore failures */
    });
  });
}
