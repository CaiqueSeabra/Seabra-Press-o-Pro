import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px; background: black; min-height: 100vh;">
    <h2>Global Error</h2>
    <pre>${event.error?.message || event.message}</pre>
    <pre>${event.error?.stack}</pre>
  </div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `<div style="color: red; padding: 20px; background: black; min-height: 100vh;">
    <h2>Unhandled Promise Rejection</h2>
    <pre>${event.reason?.message || event.reason}</pre>
    <pre>${event.reason?.stack}</pre>
  </div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
