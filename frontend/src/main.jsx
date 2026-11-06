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

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
