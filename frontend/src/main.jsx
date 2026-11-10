import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Anti-inspect disabled (commented out per request)
// if (import.meta.env.PROD) {
//   document.addEventListener('contextmenu', (e) => e.preventDefault());
//   document.addEventListener('keydown', (e) => {
//     const k = e.key?.toLowerCase();
//     if (k === 'f12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) || (e.ctrlKey && k === 'u')) e.preventDefault();
//   });
//   if (window.console) { ['log', 'warn', 'info', 'debug'].forEach(m => { window.console[m] = () => {}; }); }
// }

// Register service worker for PWA installability (desktop shortcut with logo + name)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
